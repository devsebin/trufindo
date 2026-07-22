import { IAuthSession } from "@/database/auth-sessions/auth-session-db-interface";
import RefreshSessionModel from "@/database/auth-sessions/auth-session-db-model";
import { IUser } from "@/database/users/users-db-interface";
import User from "@/database/users/users-db-model";
import {
  compareToken,
  generateTokens,
  hashToken,
} from "@/utils/helpers/authentication.helper";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
  rethrowIfKnown,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose, { HydratedDocument, Model } from "mongoose";
import {
  returnAuthenticationSuccess,
  throwError,
} from "../authentication.helper";
import { authenticationErrors } from "../authentication.messages";
import Token from "@/utils/interfaces/token.interface";
import token from "@/utils/token";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import jwt from "jsonwebtoken";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { Request } from "express";
class RefreshTokenService {
  private readonly authSessionRepository: Model<IAuthSession>;
  private readonly userRepository: Model<IUser>;

  constructor() {
    this.authSessionRepository = RefreshSessionModel;
    this.userRepository = User;
  }

  public async execute(
    req: Request,
    refreshToken: string,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      const payload = await this.verifyToken(refreshToken);
      const authSession = await this.getSession(payload.jti, session);

      const user = await this.getUser(payload.id, session);

      await this.validateSession(authSession, payload.id);

      await this.validateTokenMatch(
        refreshToken,
        authSession.refreshTokenHash,
        payload.id,
      );

      const tokens = generateTokens(user, authSession.tokenId);

      await this.rotateSession(authSession, tokens, session, dbTransactions);

      await session.commitTransaction();

      return returnAuthenticationSuccess(
        "token_refreshed",
        {
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: "Bearer",
        },
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

  // ========================= PRIVATE METHODS =========================

  private async verifyToken(refreshToken: string): Promise<Token> {
    const payload = await token.verifyRefreshToken(refreshToken);
    if (payload instanceof jwt.JsonWebTokenError) {
      const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
        message: "Invalid refresh token",
      });
      throwError("invalid_refresh_token", response);
    }

    return payload as Token;
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
      rethrowIfKnown(error, "Error fetching user", authenticationErrors);
    }
  }

  private async getSession(
    tokenId: string,
    session: mongoose.ClientSession,
  ): Promise<HydratedDocument<IAuthSession>> {
    try {
      const authSession = await this.authSessionRepository
        .findOne({ tokenId: tokenId })
        .session(session);

      if (!authSession) {
        const response = ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
          message: "Session not found",
          data: { tokenId },
        });

        throwError("session_not_found", response);
      }

      return authSession;
    } catch (error) {
      rethrowIfKnown(error, "Error fetching session", authenticationErrors);
    }
  }

  private async validateSession(
    sessionDoc: HydratedDocument<IAuthSession>,
    userId: mongoose.Types.ObjectId,
  ): Promise<void> {
    if (sessionDoc.isRevoked) {
      const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
        message: "Session revoked",
        data: { userId },
      });
      throwError("session_revoked", response);
    }
  }

  private async validateTokenMatch(
    refreshToken: string,
    storedHash: string,
    userId: mongoose.Types.ObjectId,
  ): Promise<void> {
    const isValid = await compareToken(refreshToken, storedHash);

    if (!isValid) {
      // revoke all sessions (security measure)
      await this.authSessionRepository.updateMany(
        { userId },
        { isRevoked: true, revokedAt: new Date() },
      );

      const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
        message: "Invalid refresh token",
      });

      throwError("invalid_refresh_token", response);
    }
  }

  private async rotateSession(
    sessionDoc: HydratedDocument<IAuthSession>,
    tokens: any,
    session: mongoose.ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<void> {
    try {
      sessionDoc.tokenId = tokens.token_id;
      sessionDoc.refreshTokenHash = await hashToken(tokens.refreshToken);
      sessionDoc.lastUsedAt = new Date();

      await sessionDoc.save({ session });

      dbTransactions.push(
        await createDbTransaction(
          tableName.RefreshSessions,
          apiMethods.PUT,
          operationTypes.Update,
          sessionDoc.toObject(),
        ),
      );
    } catch (error) {
      rethrowIfKnown(error, "Error rotating session", authenticationErrors);
    }
  }
}

export default new RefreshTokenService();
