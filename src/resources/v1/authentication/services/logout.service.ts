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
class logoutService {
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
      const bearer = req.headers.authorization;
      const accessToken = bearer!.split("Bearer ")[1].trim();
      const payload = await token.verifyToken(accessToken);

      if (payload instanceof jwt.JsonWebTokenError) {
        const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
          message: "Invalid access token",
        });
        throwError("invalid_access_token", response);
      }

      const authSession = await this.getSession(payload.jti, session);

      await this.logoutSession(authSession, session, dbTransactions);

      await session.commitTransaction();

      return returnAuthenticationSuccess(
        "logout_successful",
        payload,
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

  private async logoutSession(
    authSession: HydratedDocument<IAuthSession>,
    session: mongoose.ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<void> {
    try {
      authSession.isRevoked = true;
      authSession.revokedAt = new Date();

      await authSession.save({ session });

      dbTransactions.push(
        await createDbTransaction(
          tableName.RefreshSessions,
          apiMethods.PUT,
          operationTypes.Update,
          authSession.toObject(),
        ),
      );
    } catch (error) {
      rethrowIfKnown(error, "Error revoking session", authenticationErrors);
    }
  }
}

export default new logoutService();
