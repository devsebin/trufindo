import User from "@/database/users/users-db-model";
import { roleTypes } from "@/utils/definitions/constants/role-types";
import bcrypt from "bcrypt";
import mongoose, { ClientSession, HydratedDocument, Model } from "mongoose";

import {
  ErrorResponse,
  buildErrorResult,
  rethrowIfKnown,
} from "@/utils/responses/error.response";

import { SingleResponse } from "@/utils/responses/success.response";

import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";

import {
  signRefresh,
  signVerification,
  verifyToken,
} from "@/utils/helpers/authentication.helper";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { authenticationErrors } from "../authentication.messages";
import {
  buildAuthSessionObject,
  returnAuthenticationSuccess,
  throwError,
} from "../authentication.helper";
import { IUser } from "@/database/users/users-db-interface";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { IOtp } from "@/database/otp/otp-db-interface";
import { IVerifyOtpInput } from "../payloads/verify-otp.interface";
import { IAuthSession } from "@/database/auth-sessions/auth-session-db-interface";
import { UAParser } from "ua-parser-js";
import { Request } from "express";
import { generateOTPExpiry, generateToken } from "@/utils/helpers/otp-helper";
import RefreshSessionModel from "@/database/auth-sessions/auth-session-db-model";
import OtpModel from "@/database/otp/otp-db-model";

const uuid = crypto.randomUUID();
interface ITokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
class otpLoginService {
  private readonly userRepository = Model<IUser>;
  private readonly otpRepository = Model<IOtp>;
  private readonly authSessionRepository = Model<IAuthSession>;

  constructor() {
    this.userRepository = User;
    this.otpRepository = OtpModel;
    this.authSessionRepository = RefreshSessionModel;
  }

  public async execute(
    user: HydratedDocument<IUser>,
    req: Request,
    session: ClientSession,
    dbTransactions: DbTransaction[],
  ) {
    try {
      const tokens = await this.generateTokens(user);

      const authSessionPayload = await this.createAuthSessionPayload(
        user,
        tokens,
        req,
      );

      await this.validateSession(authSessionPayload);

      await this.createAuthSession(authSessionPayload, session, dbTransactions);
      const updatedUser = await this.updateUser(user);
      const result = {
        user: updatedUser,
        accessToken: tokens.accessToken,
        tokenType: "Bearer",
      };

      return result;
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error creating auth session for user",
        authenticationErrors,
      );
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(
    user: HydratedDocument<IUser>,
  ): Promise<ITokens> {
    try {
      const accessToken = signVerification(
        {
          jti: uuid,
          id: user._id,
          role: user.role,
        },
        "15m",
      );

      const refreshToken = signRefresh(
        {
          jti: uuid,
          id: user._id,
        },
        "7d",
      );

      const decoded = await verifyToken(accessToken);

      if (!decoded) {
        const response = ResponseBuilder.error(ErrorTypes.UNAUTHORIZED, {
          message: "Invalid token",
          data: {},
          filler: {},
        });

        throwError("invalid_token", response);
      }

      return {
        accessToken,
        refreshToken,
        expiresAt: decoded.exp,
      };
    } catch (error) {
      rethrowIfKnown(error, "Error while generating tokens", {});
    }
  }

  private parseUserAgent(userAgentString: string) {
    const parser = new UAParser(userAgentString);
    const result = parser.getResult();

    const deviceType = result.device.type || "desktop";

    return {
      device: deviceType === "mobile" ? "Mobile" : "Web",
      os: result.os.name
        ? `${result.os.name} ${result.os.version || ""}`.trim()
        : "",
      browser: result.browser.name
        ? `${result.browser.name} ${result.browser.version || ""}`.trim()
        : "",
    };
  }

  private async createAuthSessionPayload(
    user: HydratedDocument<IUser>,
    token: ITokens,
    req: Request,
  ): Promise<IAuthSession> {
    try {
      const userAgentString = (req.headers["user-agent"] as string) || "";

      const { device, os, browser } = this.parseUserAgent(userAgentString);

      const payload: IAuthSession = {
        userId: user._id,
        refreshTokenHash: token.refreshToken,
        tokenId: uuid,
        deviceId: "abc",
        deviceName: device,
        device: {
          userAgent: userAgentString,
          browser: browser,
          os: os,
          deviceType: device === "Mobile" ? "mobile" : "desktop",
        },
        ipAddress: req.geoData?.query ?? "::1",
        location: {
          country: req.geoData?.country ?? "",
          city: req.geoData?.city ?? "",
        },
        isRevoked: false,
        createdAt: new Date(),
        expiresAt: generateOTPExpiry(5),
      };

      return payload;
    } catch (error) {
      rethrowIfKnown(error, "Error while creating auth session", {});
    }
  }

  private async validateSession(payload: IAuthSession) {
    try {
      const session = await this.authSessionRepository.findOne({
        deviceId: payload.deviceId,
        userId: payload.userId,
      });

      if (session) {
        const response = ResponseBuilder.error(ErrorTypes.UNAUTHORIZED, {
          message: "Session already exists",
          data: {},
          filler: {},
        });
        throwError("session_already_exists", response);
      }
    } catch (error) {
      rethrowIfKnown(error, "Error while validating session", {});
    }
  }

  private async createAuthSession(
    payload: IAuthSession,
    session: mongoose.ClientSession,
    DbTransactions: DbTransaction[],
  ): Promise<HydratedDocument<IAuthSession>> {
    try {
      const doc = await this.authSessionRepository.create([payload], {
        session,
      });
      if (!doc || doc.length === 0) {
        const response = ResponseBuilder.error(
          ErrorTypes.INTERNAL_SERVER_ERROR,
          {
            message: "Error while creating auth session",
            data: { payload: payload },
            filler: { payload: payload },
          },
        );
        return throwError("auth_session_not_created", response);
      }

      DbTransactions.push(
        await createDbTransaction(
          tableName.RefreshSessions,
          apiMethods.POST,
          operationTypes.Create,
          doc[0],
        ),
      );

      return doc[0];
    } catch (error) {
      rethrowIfKnown(error, "Error while creating auth session", {});
    }
  }

  private async updateUser(user: HydratedDocument<IUser>) {
    try {
      const doc = await this.userRepository.updateOne(
        { _id: user._id },
        {
          $set: {
            last_login: new Date(),
            login_attempts: 0,
            is_locked: false,
            is_blocked: false,
            phone_verified: true,
          },
        },
        {
          upsert: true,
        },
      );
      return doc;
    } catch (error) {
      rethrowIfKnown(error, "Error while updating user", {});
    }
  }
}

export default new otpLoginService();
