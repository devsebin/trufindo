import mongoose from "mongoose";

import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { returnAuthenticationSuccess } from "../authentication.helper";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { authenticationErrors } from "../authentication.messages";
import { SingleResponse } from "@/utils/responses/success.response";
import { IVerifyOtpInput } from "../payloads/verify-otp.interface";
import { Request } from "express";

import otpService from "./otp.service";
import userService from "./user.service";
import authSessionService from "./auth-session.service";

const uuid = crypto.randomUUID();

class VerifyOtpService {
  /* ---------------- PRIVATE VARIABLES ---------------- */

  constructor() {}

  async execute(
    req: Request,
    object: IVerifyOtpInput,
    otp_id: mongoose.Types.ObjectId,
  ): Promise<SingleResponse | ErrorResponse> {
    const dbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      /* ---------------- VALIDATE OTP ---------------- */

      const otpDoc = await otpService.execute(
        otp_id,
        object,
        session,
        dbTransactions,
      );

      /* ---------------- USER MANAGEMENT ---------------- */
      const user = await userService.execute(
        otpDoc,
        req,
        object,
        session,
        dbTransactions,
      );

      /* ---------------- CREATE AUTH SESSION ---------------- */
      const tokens = await authSessionService.execute(
        req,
        user,
        session,
        dbTransactions,
      );

      /* ---------------- LOGIN USER ---------------- */
      const result = {
        user: user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: "Bearer",
      };

      await session.commitTransaction();
      return returnAuthenticationSuccess(
        "otp_verified_successfully",
        result,
        dbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };
      return buildErrorResult(err.message, authenticationErrors, err.data);
    } finally {
      session.endSession();
    }
  }

  /* ---------------- PRIVATE HELPERS ---------------- */
}

export default new VerifyOtpService();
