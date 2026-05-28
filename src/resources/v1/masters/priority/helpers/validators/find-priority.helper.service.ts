import mongoose, { HydratedDocument, Model, Types } from "mongoose";

import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";

import { IBaseFindOptions } from "@/utils/interfaces/base-find-query.interface";
import StrictFilterQuery from "@/utils/helpers/query-filter";
import { IPriorities } from "@/database/priority/priority-db-interface";
import PriorityModel from "@/database/priority/priority-db-model";
import { throwError } from "../../priority.helper";
import { priorityErrorResponse } from "../../priority.response";

export type IFindPriority = StrictFilterQuery<
  IPriorities & { _id: Types.ObjectId }
>;

class findPriorityHelperService {
  private readonly priorityRepository: Model<IPriorities>;

  constructor() {
    this.priorityRepository = PriorityModel;
  }

  public async execute(
    query: IFindPriority,
    errorMap: Record<string, { message: string; status: number }>,
    options: IBaseFindOptions & {
      session?: mongoose.ClientSession;
    } = {},
  ): Promise<HydratedDocument<IPriorities>[]> {
    const {
      throwIfExists = false,
      throwIfNotFound = false,
      returnDocument = true,
      lean = false,
      select,
      session,
    } = options;

    try {
      let dbQuery = this.priorityRepository
        .find(query)
        .session(session || null);

      if (select) {
        dbQuery = dbQuery.select(select);
      }

      if (lean) {
        dbQuery = dbQuery.lean();
      }

      const documents = await dbQuery;

      if (throwIfExists && documents.length > 0) {
        const data = priorityErrorResponse(documents[0]);
        const response = ResponseBuilder.error(ErrorTypes.CONFLICT, {
          message: "priority already exists",
          data: data,
          filler: { 0: documents[0].label },
        });

        throwError("already_exists", response);
      }

      if (throwIfNotFound && documents.length === 0) {
        const response = ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
          message: "priority not found",
          data: query,
        });

        throwError("priority_not_found", response);
      }

      if (!returnDocument) {
        return [];
      }

      return documents as HydratedDocument<IPriorities>[];
    } catch (error) {
      rethrowIfKnown(error, "Error while finding priority", errorMap);
    }
  }
}

export default new findPriorityHelperService();
