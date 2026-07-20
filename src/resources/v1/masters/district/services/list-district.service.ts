import { IDistrict } from "@/database/district/district-db-interface";
import DistrictModel from "@/database/district/district-db-model";
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
import { listResponse } from "@/utils/responses/success.response";
import { Request } from "express";
import mongoose, { Model } from "mongoose";
import { districtPayload } from "../district.helper";
import { districtListResponse } from "../district.response";
import { districtErrorsMessages } from "../district.messages";

class listDistrictService {
  private readonly districtRepository: Model<IDistrict>;

  constructor() {
    this.districtRepository = DistrictModel;
  }

  async execute(
    request: Request,
    is_export = false,
  ): Promise<listResponse | ErrorResponse> {
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

      const [districts, totalCount] = await Promise.all([
        query
          .session(session)
          .sort({
            [conditions.order_by as string || "createdAt"]:
              conditions.order_direction === "asc" ? 1 : -1,
          })
          .exec(),
        this.districtRepository.countDocuments(where).session(session),
      ]);

      DbTransactions.push(
        await createDbTransaction(
          tableName.Districts,
          apiMethods.GET,
          operationTypes.Read,
          districts,
        ),
      );

      const data = {
        current_page: page,
        totalCount: totalCount,
        rows_per_page: limit,
        last_page: Math.ceil(totalCount / limit),
        from: 1 + offset,
        rows: districtListResponse(districts),
      };
      return districtPayload("district_listed", data, DbTransactions);
    } catch (error) {
      const err = error as Error & { data?: any };
      await session.abortTransaction();
      return buildErrorResult(err.message, districtErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }

  private buildQuery(where: any, conditions: any, offset: number): any {
    const query = this.districtRepository.find(where);
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

export default new listDistrictService();
