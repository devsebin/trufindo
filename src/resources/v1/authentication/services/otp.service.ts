import { IOtp } from "@/database/otp/otp-db-interface";
import mongoose, {
  ClientSession,
  Document,
  HydratedDocument,
} from "mongoose";
import { throwError } from "../authentication.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { authenticationErrors } from "../authentication.messages";
import bcrypt from "bcrypt";
import { IVerifyOtpInput } from "../payloads/verify-otp.interface";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";

import validateOtpHelperService from "../helpers/validators/validate-otp.helper.service";
import otpOperationsHelperService from "../helpers/operations/otp-operations.helper.service";

const MAX_OTP_ATTEMPTS = 5;

class otpService {
  async execute(
    otp_id: mongoose.Types.ObjectId,
    object: IVerifyOtpInput,
    session: ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<HydratedDocument<IOtp>> {
    const otpDoc = await validateOtpHelperService.validateOTP(otp_id, session);

    await validateOtpHelperService.checkOtpState(otpDoc, session);

    await validateOtpHelperService.verifyRateLimit(otpDoc, session);

    await this.compareAndProcessOTP(object.otp, otpDoc, session);

    return otpDoc;
  }

  private async compareAndProcessOTP(
    otp: string,
    document: IOtp & Document,
    session: ClientSession,
  ): Promise<void> {
    try {
      const isMatch = await bcrypt.compare(otp, document.otp_hash);

      if (isMatch) {
        await otpOperationsHelperService.markOtpAsUsed(document, session);
        return;
      }

      await otpOperationsHelperService.incrementAttempts(document, MAX_OTP_ATTEMPTS);

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
}

export default new otpService();
