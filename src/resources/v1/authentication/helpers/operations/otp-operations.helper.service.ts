import mongoose, { ClientSession, Document, HydratedDocument, Model } from "mongoose";
import OtpModel from "@/database/otp/otp-db-model";
import { IOtp, IOtpInput } from "@/database/otp/otp-db-interface";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { authenticationErrors } from "../../authentication.messages";

class otpOperationsHelperService {
  private readonly otpRepository: Model<IOtp>;

  constructor() {
    this.otpRepository = OtpModel;
  }

  public async expireOldOtps(
    phoneE164: string,
    session: ClientSession,
  ): Promise<void> {
    try {
      const result = await this.otpRepository.updateMany(
        { phoneNumber: phoneE164, is_active: true },
        { is_active: false, expires_at: new Date() },
        { session },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `Expired ${result.modifiedCount} old OTP(s) for ${phoneE164}`,
        );
      }
    } catch (error) {
      rethrowIfKnown(error, "Error expiring old OTPs", authenticationErrors);
    }
  }

  public async storeOtp(
    object: IOtpInput,
    session: ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<IOtp & Document> {
    try {
      const OtpDocument = new this.otpRepository(object);
      await OtpDocument.save({ session });

      // Log the database transaction
      dbTransactions.push(
        await createDbTransaction(
          tableName.Otp,
          apiMethods.POST,
          operationTypes.Create,
          OtpDocument,
        ),
      );

      return OtpDocument.toObject();
    } catch (error) {
      rethrowIfKnown(error, "Error storing OTP", authenticationErrors);
      return null as any;
    }
  }

  public async markOtpAsUsed(
    otp: IOtp & Document,
    session: ClientSession,
  ): Promise<void> {
    try {
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
    } catch (error) {
      rethrowIfKnown(error, "Error marking OTP as used", authenticationErrors);
    }
  }

  public async incrementAttempts(
    otp: IOtp & Document,
    maxAttempts: number,
  ): Promise<void> {
    try {
      const updated = await this.otpRepository.findOneAndUpdate(
        { _id: otp._id },
        {
          $inc: { attempts: 1 },
          $set: { last_seen_at: new Date() },
        },
        { new: true },
      );

      if (updated && updated.attempts >= maxAttempts) {
        await this.otpRepository.updateOne(
          { _id: otp._id },
          { $set: { is_active: false } },
        );
      }
    } catch (error) {
      rethrowIfKnown(error, "Error incrementing OTP attempts", authenticationErrors);
    }
  }
}

export default new otpOperationsHelperService();
