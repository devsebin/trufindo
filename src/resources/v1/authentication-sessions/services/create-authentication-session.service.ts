import { IAuthSession } from "@/database/auth-sessions/auth-session-db-interface";
import RefreshSessionModel from "@/database/auth-sessions/auth-session-db-model";
import { IUser } from "@/database/users/users-db-interface";
import User from "@/database/users/users-db-model";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
  rethrowIfKnown,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import { Request } from "express";
import mongoose, { HydratedDocument, Model } from "mongoose";
import {
  returnAuthenticationSessionSuccess,
  throwError,
} from "../authentication-session.helper";
import { authenticationSessionErrorMessages } from "../authentication-session.messages";
import { generateToken } from "@/utils/helpers/otp-helper";
import {
  generateTokens,
  hashToken,
} from "@/utils/helpers/authentication.helper";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { UAParser } from "ua-parser-js";

class createAuthenticationSession {
  private readonly authSessionRepository: Model<IAuthSession>;
  private readonly userRepository = Model<IUser>;

  constructor() {
    this.authSessionRepository = RefreshSessionModel;
    this.userRepository = User;
  }

  public async execute(
    request: Request,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];
    try {
      session.startTransaction();

      const user = await this.getUser(request.user._id, session);
      const token = generateTokens(user);

      const authSessionPayload = await this.createAuthSessionPayload(
        user,
        token,
        request,
      );

      const result = await this.createAuthSession(
        authSessionPayload,
        session,
        dbTransactions,
      );
      await session.commitTransaction();

      return returnAuthenticationSessionSuccess(
        "session_created",
        result,
        dbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };

      return buildErrorResult(
        err.message,
        authenticationSessionErrorMessages,
        err.data,
      );
    } finally {
      session.endSession();
    }
  }

  private async getUser(
    userId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession,
  ): Promise<HydratedDocument<IUser>> {
    try {
      const user = await this.userRepository.findById(userId).session(session);
      if (!user) {
        const response = ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
          message: "User not found",
          data: { userId },
        });
        throwError("user_not_found", response);
      }
      return user;
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error fetching user",
        authenticationSessionErrorMessages,
      );
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
    token: any,
    req: Request,
  ): Promise<IAuthSession> {
    try {
      const userAgentString = (req.headers["user-agent"] as string) || "";

      const { device, os, browser } = this.parseUserAgent(userAgentString);

      const payload: IAuthSession = {
        userId: user._id,
        refreshTokenHash: hashToken(token.refreshToken),
        tokenId: token.token_id,
        deviceId: generateToken(10),
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      return payload;
    } catch (error) {
      rethrowIfKnown(error, "Error while creating auth session", {});
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
}

export default new createAuthenticationSession();
