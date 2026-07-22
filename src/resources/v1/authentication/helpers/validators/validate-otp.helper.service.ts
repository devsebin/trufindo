import mongoose, { ClientSession, Document, HydratedDocument, Model } from "mongoose";
import OtpModel from "@/database/otp/otp-db-model";
import { IOtp } from "@/database/otp/otp-db-interface";
import { throwError } from "../../authentication.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { authenticationErrors } from "../../authentication.messages";

const MAX_OTP_ATTEMPTS = 5;

class validateOtpHelperService {
  private readonly otpRepository: Model<IOtp>;

  constructor() {
    this.otpRepository = OtpModel;
  }

  public async validateOTP(
    otp_id: mongoose.Types.ObjectId,
    session: ClientSession,
  ): Promise<HydratedDocument<IOtp>> {
    try {
      const otp = await this.otpRepository
        .findOne({ _id: otp_id })
        .session(session);

      if (!otp) {
        throwError(
          "otp_not_found",
          ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
            message: "OTP not found",
            data: { id: otp_id },
            filler: { 0: otp_id },
          }),
        );
      }

      return otp as HydratedDocument<IOtp>;
    } catch (error) {
      rethrowIfKnown(error, "Error validating OTP", authenticationErrors);
      return null as any;
    }
  }

  public async checkOtpState(
    otp: IOtp & Document,
    session: ClientSession,
  ): Promise<void> {
    if (otp.is_used) {
      throwError(
        "otp_already_used",
        ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
          message: "OTP already used",
        }),
      );
    }

    if (!otp.is_active) {
      throwError(
        "otp_inactive",
        ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
          message: "OTP is inactive",
        }),
      );
    }

    if (new Date() > otp.expires_at) {
      await this.otpRepository
        .updateOne({ _id: otp._id }, { $set: { is_active: false } })
        .session(session);

      throwError(
        "otp_expired",
        ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
          message: "OTP expired",
        }),
      );
    }
  }

  public async verifyRateLimit(
    otp: IOtp & Document,
    session: ClientSession,
  ): Promise<void> {
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      await this.otpRepository
        .updateOne({ _id: otp._id }, { $set: { is_active: false } })
        .session(session);

      throwError(
        "otp_attempt_limit_exceeded",
        ResponseBuilder.error(ErrorTypes.TOO_MANY_REQUESTS, {
          message: "Maximum OTP attempts exceeded",
        }),
      );
    }
  }
}

export default new validateOtpHelperService();
