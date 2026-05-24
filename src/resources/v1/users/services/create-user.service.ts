import { IUser } from "@/database/users/users-db-interface";
import User from "@/database/users/users-db-model";
import mongoose, { HydratedDocument, Model } from "mongoose";
import { SingleResponse } from "@/utils/responses/success.response";
import {
  buildErrorResult,
  ErrorResponse,
  rethrowIfKnown,
} from "@/utils/responses/error.response";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { Request } from "express";
import { IInputUserPayload } from "../payloads/user-input.interface";
import { returnUserSuccess, throwError } from "../users.helper";
import { userErrorMessages } from "../users.messages";
import findUserHelperService from "../helpers/validators/find-user.helper.service";
import createUserHelperService from "../helpers/create-user.helper.service";

class createUserService {
  public async execute(
    request: Request,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const DbTransactions: DbTransaction[] = [];
    try {
      const payload: IInputUserPayload = request.body;
      session.startTransaction();

      const existing = await findUserHelperService.execute(
        { $or: [{ email: payload.email }, { phone: payload.phone }] },
        userErrorMessages,
        { throwIfExists: false, lean: true, returnDocument: true },
      );

      if (existing) {
        await this.validateUniqueFields(payload, existing);
      }

      const document = await createUserHelperService.execute(
        payload,
        session,
        DbTransactions,
      );

      await session.commitTransaction();

      return returnUserSuccess("user_created", document, DbTransactions);
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };
      return buildErrorResult(err.message, userErrorMessages, err.data);
    } finally {
      session.endSession();
    }
  }

  /**
   * Validate unique constraints (name, iso codes)
   */
  private async validateUniqueFields(
    payload: IInputUserPayload,
    existing: HydratedDocument<IUser>,
  ): Promise<void> {
    try {
      if (existing.email === payload.email) {
        const response = ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
          message: "User with same email already exists",
          data: { email: payload.email },
          filler: { 0: payload.email },
        });
        throwError("email_already_exists", response);
      }

      if (existing.phone === payload.phone) {
        const response = ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
          message: "User with same phone number already exists",
          data: { phone: payload.phone },
          filler: { 0: payload.phone },
        });
        throwError("phone_already_exists", response);
      }
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error while validating user uniqueness",
        userErrorMessages,
      );
    }
  }
}

export default new createUserService();
