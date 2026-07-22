import { IOtp } from "@/database/otp/otp-db-interface";
import OtpModel from "@/database/otp/otp-db-model";
import mongoose, {
  ClientSession,
  Document,
  HydratedDocument,
  Model,
} from "mongoose";
import { throwError } from "../authentication.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { authenticationErrors } from "../authentication.messages";
import bcrypt from "bcrypt";
import { IVerifyOtpInput } from "../payloads/verify-otp.interface";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
const MAX_OTP_ATTEMPTS = 5;
class otpService {
  private otpRepository: Model<IOtp>;

  constructor() {
    this.otpRepository = OtpModel;
  }
  async execute(
    otp_id: mongoose.Types.ObjectId,
    object: IVerifyOtpInput,
    session: ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<HydratedDocument<IOtp>> {
    const otpDoc = await this.validateOTP(otp_id, session);

    await this.checkOtpState(otpDoc, session);

    await this.verifyRateLimit(otpDoc, session);

    await this.compareAndProcessOTP(object.otp, otpDoc, session);

    return otpDoc;
  }

  private async validateOTP(
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

      return otp;
    } catch (error) {
      rethrowIfKnown(error, "Error validating OTP", authenticationErrors);
    }
  }

  private async checkOtpState(
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

  private async verifyRateLimit(
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

  private async compareAndProcessOTP(
    otp: string,
    document: IOtp & Document,
    session: ClientSession,
  ): Promise<void> {
    try {
      const isMatch = await bcrypt.compare(otp, document.otp_hash);

      if (isMatch) {
        await this.markOtpAsUsed(document, session);
        return;
      }

      await this.incrementAttempts(document);

      throwError(
        "otp_not_valid",
        ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
          message: "Invalid OTP",
        }),
      );
    } catch (error) {
      rethrowIfKnown(error, "Error comparing OTP", authenticationErrors);
    }
  }

  private async markOtpAsUsed(
    otp: IOtp & Document,
    session: ClientSession,
  ): Promise<void> {
    await this.otpRepository
      .updateOne(
        { _id: otp._id },
        {
          $set: {
            is_used: true,
            is_active: false,
            last_seen_at: new Date(),
          },
        },
      )
      .session(session);
  }

  private async incrementAttempts(otp: IOtp & Document): Promise<void> {
    const updated = await this.otpRepository.findOneAndUpdate(
      { _id: otp._id },
      {
        $inc: { attempts: 1 },
        $set: { last_seen_at: new Date() },
      },
      { new: true },
    );

    if (updated && updated.attempts >= MAX_OTP_ATTEMPTS) {
      await this.otpRepository.updateOne(
        { _id: otp._id },
        { $set: { is_active: false } },
      );
    }
  }
}

export default new otpService();
