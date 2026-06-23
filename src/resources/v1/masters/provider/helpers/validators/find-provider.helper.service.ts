import mongoose, { HydratedDocument, Model, Types } from "mongoose";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";

import { IBaseFindOptions } from "@/utils/interfaces/base-find-query.interface";
import StrictFilterQuery from "@/utils/helpers/query-filter";
import { IProvider } from "@/database/provider/provider-db-interface";
import { ProviderModel } from "@/database/provider/provider-db-model";
import { throwError } from "../../provider.helper";

export type IFindStatus = StrictFilterQuery<
  IProvider & { _id: Types.ObjectId }
>;

class findProviderHelperService {
  private readonly providerRepository: Model<IProvider>;

  constructor() {
    this.providerRepository = ProviderModel;
  }

  public async execute(
    query: IFindStatus,
    errorMap: Record<string, { message: string; status: number }>,
    options: IBaseFindOptions & {
      session?: mongoose.ClientSession;
    } = {},
  ): Promise<HydratedDocument<IProvider>[]> {
    const {
      throwIfExists = false,
      throwIfNotFound = false,
      returnDocument = true,
      lean = false,
      select,
      session,
    } = options;

    try {
      let dbQuery = this.providerRepository
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
        const response = ResponseBuilder.error(ErrorTypes.CONFLICT, {
          message: "Provider already exists",
          data: query,
          filler: { 0: documents[0].name },
        });

        throwError("already_exists", response);
      }

      if (throwIfNotFound && documents.length === 0) {
        const response = ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
          message: "Provider not found",
          data: query,
        });

        throwError("provider_not_found", response);
      }

      if (!returnDocument) {
        return [];
      }

      return documents as HydratedDocument<IProvider>[];
    } catch (error) {
      rethrowIfKnown(error, "Error while finding provider", errorMap);
    }
  }
}

export default new findProviderHelperService();
