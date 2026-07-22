import mongoose, { Model } from "mongoose";
import { Request } from "express";

import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { IAuthSession } from "@/database/auth-sessions/auth-session-db-interface";
import { IUser } from "@/database/users/users-db-interface";
import RefreshSessionModel from "@/database/auth-sessions/auth-session-db-model";
import User from "@/database/users/users-db-model";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { listResponse } from "@/utils/responses/success.response";
import { buildWhereClause } from "@/utils/helpers/build-query.helper";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { returnAuthenticationSessionSuccess } from "../authentication-session.helper";
import { authenticationSessionErrorMessages } from "../authentication-session.messages";
import { refreshSessionListResponse } from "../authentication-session.response";

class listAuthenticationSessionService {
  private readonly authSessionRepository: Model<IAuthSession>;
  private readonly userRepository = Model<IUser>;

  constructor() {
    this.authSessionRepository = RefreshSessionModel;
    this.userRepository = User;
  }

  public async execute(
    request: Request,
    is_export = false,
  ): Promise<listResponse | ErrorResponse> {
    const conditions = request.query;
    const page = parseInt(conditions.page as string, 10) || 1;
    const limit = parseInt(conditions.limit as string, 10) || 10; // limit: rows per page
    const offset = limit * (page - 1);
    const where = await buildWhereClause(request);
    const query = this.buildQuery(where, conditions, offset);
    const dbTransactions: DbTransaction[] = [];

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const [result, totalCount] = await Promise.all([
        query
          .session(session)
          .sort({
            [conditions.order_by as string]:
              conditions.order_direction === "asc" ? 1 : -1,
          })
          .exec(),
        this.authSessionRepository.countDocuments(where).session(session),
      ]);

      dbTransactions.push(
        await createDbTransaction(
          tableName.RefreshSessions,
          apiMethods.GET,
          operationTypes.Read,
          refreshSessionListResponse(result),
        ),
      );

      await session.commitTransaction();

      const data = {
        current_page: page,
        totalCount,
        rows_per_page: limit,
        last_page: Math.ceil(totalCount / limit),
        from: 1 + offset,
        rows: refreshSessionListResponse(result),
      };

      return returnAuthenticationSessionSuccess(
        "authentication_sessions_listed",
        data,
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

  /**
   * Build Mongo query
   */
  private buildQuery(where: any, conditions: any, offset: number): any {
    const query = this.authSessionRepository.find(where);
    const orderBy: any = {};

    if (conditions.populate) {
      query.populate(conditions.populate);
    }

    if (conditions.order_by) {
      orderBy[conditions.order_by] =
        conditions.order_direction === "asc" ? 1 : -1;
      query.sort(orderBy);
    }

    if (conditions.fields) {
      query.select(conditions.fields.split(",").map((f: string) => f.trim()));
    }

    if (conditions.limit) {
      query.limit(Number(conditions.limit));
    }

    if (conditions.page) {
      query.skip(offset);
    }

    return query;
  }
}

export default new listAuthenticationSessionService();
