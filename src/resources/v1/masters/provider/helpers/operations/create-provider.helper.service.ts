import { IProvider } from "@/database/provider/provider-db-interface";
import { ProviderModel } from "@/database/provider/provider-db-model";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { tableName } from "@/utils/definitions/constants/table-names";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import mongoose, { HydratedDocument, Model } from "mongoose";

class createProviderHelperService {
  private readonly providerRepository: Model<IProvider>;

  constructor() {
    this.providerRepository = ProviderModel;
  }
  public async execute(
    payload: Partial<IProvider>,
    session: mongoose.ClientSession,
    DbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<HydratedDocument<IProvider>> {
    try {
      const doc = new this.providerRepository(payload);
      await doc.save({ session });

      DbTransactions.push(
        await createDbTransaction(
          tableName.Providers,
          apiMethods.POST,
          operationTypes.Create,
          doc.toObject(),
        ),
      );
      return doc;
    } catch (error) {
      rethrowIfKnown(error, "Error while creating new provider", errorMap);
    }
  }
}

export default new createProviderHelperService();
