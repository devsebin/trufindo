import mongoose from "mongoose";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { authenticationErrors } from "../authentication.messages";
import {
  returnAuthenticationSuccess,
} from "../authentication.helper";

import findUserHelperService from "../helpers/validators/find-user.helper.service";
import loginOperationsHelperService from "../helpers/operations/login-operations.helper.service";
import findStatusHelperService from "../../masters/status/helpers/validators/find-status.helper.service";

class loginAdminService {
  public async execute(
    email: string,
    password: string,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const DbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      const activeStatus = await findStatusHelperService.execute({ label: "active" }, authenticationErrors, {
        throwIfNotFound: true,
        throwIfExists: false,
        returnDocument: true,
        lean: false,
        select: {
          _id: 1
        },
        session,
      });
      const user = await findUserHelperService.findAdminUser(email, session, activeStatus[0].id as mongoose.Types.ObjectId);
      await findUserHelperService.validatePassword(password, user);

      const tokens = await loginOperationsHelperService.generateTokens(user);

      const result = {
        user,
        ...tokens,
        tokenType: "Bearer",
      };

      await loginOperationsHelperService.storeRefreshToken(
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
}

export default new loginAdminService();
