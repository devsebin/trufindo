import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { tableName } from "@/utils/definitions/constants/table-names";
import { buildWhereClause } from "@/utils/helpers/build-query.helper";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import { Request } from "express";
import mongoose, { Model } from "mongoose";
import { declaimerResponse } from "../declaimer.response";
import { returnDeclaimerSuccess } from "../declaimer.helper";
import { declaimerErrorsMessages } from "../declaimer.messages";

class listDeclaimerService {
  private readonly declaimerRepository: Model<IDeclaimer>;

  constructor() {
    this.declaimerRepository = DeclaimerModel;
  }
  async execute(
    request: Request,
    is_export = false,
  ): Promise<SingleResponse | ErrorResponse> {
    const conditions = request.query;
    const page = parseInt(conditions.page as string, 10) || 1;
    const limit = parseInt(conditions.limit as string, 10) || 10;
    const offset = limit * (page - 1);
    const where = await buildWhereClause(request);

    const query = this.buildQuery(where, conditions, offset);
    const DbTransactions: DbTransaction[] = [];

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const [declaimers, totalCount] = await Promise.all([
        query
          .session(session)
          .sort({
            [conditions.order_by as string]:
              conditions.order_direction === "asc" ? 1 : -1,
          })
          .exec(),
        this.declaimerRepository.countDocuments(where).session(session),
      ]);

      DbTransactions.push(
        await createDbTransaction(
          tableName.Declaimers,
          apiMethods.GET,
          operationTypes.Read,
          declaimerResponse(declaimers),
        ),
      );

      // Commit the transaction (not strictly required for reads, but keeps structure consistent)
      await session.commitTransaction();

      const data = {
        current_page: conditions.page,
        totalCount: totalCount,
        rows_per_page: limit,
        last_page: Math.ceil(totalCount / limit),
        from: 1 + offset,
        rows: declaimerResponse(declaimers),
      };

      return returnDeclaimerSuccess(
        "declaimer_list_fetched",
        data,
        DbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };
      return buildErrorResult(err.message, declaimerErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }

  private buildQuery(where: any, conditions: any, offset: number): any {
    const query = this.declaimerRepository.find(where);
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
      query.select(
        conditions.fields.split(",").map((field: string) => field.trim()),
      );
    }

    if (conditions.limit) {
      query.limit(conditions.limit);
    }

    if (conditions.page) {
      query.skip(offset);
    }

    return query;
  }
}

export default new listDeclaimerService();
