import mongoose, { ClientSession, Model } from "mongoose";
import OtpModel from "@/database/otp/otp-db-model";
import { IOtp } from "@/database/otp/otp-db-interface";
import { throwError } from "../../authentication.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { authenticationErrors } from "../../authentication.messages";

const OTP_COOLDOWN_SECONDS = 30;
const OTP_MAX_REQUESTS = 5; // per window
const OTP_WINDOW_MINUTES = 10;

class checkOtpLimitsHelperService {
  private readonly otpRepository: Model<IOtp>;

  constructor() {
    this.otpRepository = OtpModel;
  }

  public async execute(
    phoneE164: string,
    session: ClientSession,
  ): Promise<void> {
    try {
      const now = new Date();
      const windowStart = new Date(
        now.getTime() - OTP_WINDOW_MINUTES * 60 * 1000,
      );

      const result = await this.otpRepository
        .aggregate([
          {
            $match: { phoneNumber: phoneE164, createdAt: { $gte: windowStart } },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              lastCreated: { $max: "$createdAt" },
            },
          },
        ])
        .session(session);

      const count = result[0]?.count || 0;
      const lastCreated = result[0]?.lastCreated
        ? new Date(result[0].lastCreated)
        : null;

      // Cooldown check
      if (lastCreated) {
        const secondsSinceLast = (now.getTime() - lastCreated.getTime()) / 1000;
        if (secondsSinceLast < OTP_COOLDOWN_SECONDS) {
          const response = ResponseBuilder.error(ErrorTypes.CONFLICT, {
            message: "OTP cooldown active. Please wait before requesting again.",
            data: {
              phoneNumber: phoneE164,
              cooldownSeconds: Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLast),
            },
            filler: {
              phoneNumber: phoneE164,
              cooldownSeconds: Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLast),
            },
          });
          throwError("otp_cooldown_active", response);
        }
      }

      if (count >= OTP_MAX_REQUESTS) {
        const response = ResponseBuilder.error(ErrorTypes.CONFLICT, {
          message: "OTP request limit exceeded. Please try again later.",
          data: { phoneNumber: phoneE164, windowMinutes: OTP_WINDOW_MINUTES },
          filler: { phoneNumber: phoneE164, windowMinutes: OTP_WINDOW_MINUTES },
        });
        throwError("otp_rate_limit_exceeded", response);
      }
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error checking OTP rate limits",
        authenticationErrors,
      );
    }
  }
}

export default new checkOtpLimitsHelperService();
