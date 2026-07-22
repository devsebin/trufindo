import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { tableName } from "@/utils/definitions/constants/table-names";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { throwError } from "../authentication.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import mongoose, { ClientSession, HydratedDocument, Model } from "mongoose";
import { IAuthSession } from "@/database/auth-sessions/auth-session-db-interface";
import RefreshSessionModel from "@/database/auth-sessions/auth-session-db-model";
import { UAParser } from "ua-parser-js";
import { IUser } from "@/database/users/users-db-interface";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { Request } from "express";
import { generateOTPExpiry, generateToken } from "@/utils/helpers/otp-helper";
import User from "@/database/users/users-db-model";
import {
  generateTokens,
  hashToken,
} from "@/utils/helpers/authentication.helper";
const uuid = crypto.randomUUID();

export interface ITokens {
  accessToken: string;
  refreshToken: string;
  token_id: any;
}

class authSessionService {
  private readonly authSessionRepository: Model<IAuthSession>;
  private readonly userRepository = Model<IUser>;

  constructor() {
    this.authSessionRepository = RefreshSessionModel;
    this.userRepository = User;
  }
  async execute(
    req: Request,
    user: HydratedDocument<IUser>,
    session: mongoose.ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<ITokens> {
    const token = await generateTokens(user);

    const authSessionPayload = await this.createAuthSessionPayload(
      user,
      token,
      req,
    );

    await this.createAuthSession(authSessionPayload, session, dbTransactions);

    return token;
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
      const userAgentString = (req.headers["user-agent"] as string) || "Unknown";

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
  ): Promise<void> {
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
    } catch (error) {
      rethrowIfKnown(error, "Error while creating auth session", {});
    }
  }
}

export default new authSessionService();
