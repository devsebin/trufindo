import User from "@/database/users/users-db-model";
import { roleTypes } from "@/utils/definitions/constants/role-types";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

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
  returnAuthenticationSuccess,
  throwError,
} from "../authentication.helper";
import { IUser } from "@/database/users/users-db-interface";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";

class loginAdminService {
  private readonly userRepository: typeof User;

  constructor() {
    this.userRepository = User;
  }

  public async execute(
    email: string,
    password: string,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const DbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      const user = await this.findAdminUser(email, session);
      await this.validatePassword(password, user);

      const tokens = await this.generateTokens(user);

      const result = {
        user,
        ...tokens,
        tokenType: "Bearer",
      };

      await this.storeRefreshToken(
        tokens.refreshToken,
        user,
        session,
        DbTransactions,
      );
      await session.commitTransaction();

      return returnAuthenticationSuccess("admin_login", result, DbTransactions);
    } catch (error) {
      await session.abortTransaction();

      const err = error as Error & { data?: any };
      return buildErrorResult(err.message, authenticationErrors, err.data);
    } finally {
      session.endSession();
    }
  }

  /**
   * Find admin user
   */
  private async findAdminUser(email: string, session: mongoose.ClientSession) {
    try {
      const user = await this.userRepository
        .findOne({
          email,
          role: { $in: [roleTypes.SuperAdmin, roleTypes.Admin, roleTypes.Employee] },
          status: true,
          is_deleted: false,
          is_active: true,
        })
        .session(session)
        .exec();

      if (!user || !user.password) {
        const response = ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
          message: "User not found",
          data: { email },
          filler: { email },
        });

        throwError("user_not_found", response);
      }

      return user;
    } catch (error) {
      rethrowIfKnown(error, "Error while fetching admin user", {});
    }
  }

  /**
   * Validate password
   */
  private async validatePassword(password: string, user: any): Promise<void> {
    try {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        const response = ResponseBuilder.error(ErrorTypes.UNAUTHORIZED, {
          message: "Invalid credentials",
          data: {},
          filler: {},
        });

        throwError("invalid_credentials", response);
      }
    } catch (error) {
      rethrowIfKnown(error, "Error while validating password", {});
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: any) {
    try {
      const accessToken = signVerification(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        "15m",
      );

      const refreshToken = signRefresh(
        {
          id: user.id,
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

  private async storeRefreshToken(
    refreshToken: string,
    user: IUser,
    session: mongoose.ClientSession,
    DbTransactions: DbTransaction[],
  ): Promise<void> {
    try {
      const doc = await this.userRepository
        .updateOne({ _id: user.id }, { $set: { refresh_token: refreshToken } })
        .session(session)
        .exec();

      DbTransactions.push(
        await createDbTransaction(
          tableName.User,
          apiMethods.POST,
          operationTypes.Login,
          doc,
        ),
      );
      console.log(doc);
      return;
    } catch (error) {
      rethrowIfKnown(error, "Error while storing refresh token", {});
    }
  }
}

export default new loginAdminService();
