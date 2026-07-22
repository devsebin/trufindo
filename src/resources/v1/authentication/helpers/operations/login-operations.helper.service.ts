import mongoose, { ClientSession, Model } from "mongoose";
import User from "@/database/users/users-db-model";
import { IUser } from "@/database/users/users-db-interface";
import {
  signRefresh,
  signVerification,
  verifyToken,
} from "@/utils/helpers/authentication.helper";
import { throwError } from "../../authentication.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { authenticationErrors } from "../../authentication.messages";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";

class loginOperationsHelperService {
  private readonly userRepository: Model<IUser>;

  constructor() {
    this.userRepository = User;
  }

  public async generateTokens(user: any) {
    try {
      const accessToken = signVerification(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        "7d",
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
      rethrowIfKnown(error, "Error while generating tokens", authenticationErrors);
      return null as any;
    }
  }

  public async storeRefreshToken(
    refreshToken: string,
    user: IUser,
    session: ClientSession,
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
      rethrowIfKnown(error, "Error while storing refresh token", authenticationErrors);
    }
  }
}

export default new loginOperationsHelperService();
