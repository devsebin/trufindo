import mongoose from "mongoose";
import { generateOTP, generateOTPExpiry } from "@/utils/helpers/otp-helper";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  returnAuthenticationSuccess,
  throwError,
} from "../authentication.helper";
import { otpResponse } from "../authentication.response";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { authenticationErrors } from "../authentication.messages";
import { SingleResponse } from "@/utils/responses/success.response";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import bcrypt from "bcrypt";

import { IDeclaimerInput } from "../payloads/verify-otp.interface";
import { IOtpInput } from "@/database/otp/otp-db-interface";

import normalizePhoneHelperService from "../helpers/validators/normalize-phone.helper.service";
import findUserHelperService from "../helpers/validators/find-user.helper.service";
import validateDeclaimersHelperService from "../helpers/validators/validate-declaimers.helper.service";
import checkOtpLimitsHelperService from "../helpers/validators/check-otp-limits.helper.service";
import otpOperationsHelperService from "../helpers/operations/otp-operations.helper.service";

interface Options {
  phone: string;
  country: string;
  device_id: string;
  type: string;
  user_type: string;
  declaimers: IDeclaimerInput[];
}

const OTP_EXPIRY_MINUTES = 5;

class OtpService {
  async execute(object: Options): Promise<SingleResponse | ErrorResponse> {
    const dbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Normalize phone number
      const phoneE164 = await normalizePhoneHelperService.execute(
        object.phone,
        object.country,
        session,
      );

      if (object.type === "register") {
        if (object.user_type !== "user") {
          const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
            message: "Registration is not permitted for the requested role",
          });
          throwError("registration_role_restricted", response);
        }
        await findUserHelperService.ensureUserDoesNotExist(phoneE164, session);
        await validateDeclaimersHelperService.execute(object.declaimers, session, true);
      }

      // Apply OTP rate limits & cooldown
      await checkOtpLimitsHelperService.execute(phoneE164, session);

      // Expire old OTPs
      await otpOperationsHelperService.expireOldOtps(phoneE164, session);

      // Generate OTP
      const otp = await generateOTP();
      const otpDocument: IOtpInput = {
        phoneNumber: phoneE164,
        country_code: object.country,
        device_id: object.device_id,
        otp_type: object.type,
        user_type: object.user_type,
        otp_hash: await bcrypt.hash(otp, 10),
        expires_at: generateOTPExpiry(OTP_EXPIRY_MINUTES),
        last_seen_at: new Date(),
        declaimers: object.declaimers,
      };

      // Store OTP
      const otpDocumentSaved = await otpOperationsHelperService.storeOtp(
        otpDocument,
        session,
        dbTransactions,
      );

      await session.commitTransaction();
      console.log(otp);
      return returnAuthenticationSuccess(
        "otp_sent_successfully",
        otpResponse(otpDocumentSaved),
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
}

export default new OtpService();
