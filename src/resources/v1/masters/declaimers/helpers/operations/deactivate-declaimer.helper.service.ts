import mongoose, { ClientSession, Model } from "mongoose";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { rethrowIfKnown } from "@/utils/responses/error.response";

class deactivateDeclaimerHelperService {
  private readonly declaimerRepository: Model<IDeclaimer>;

  constructor() {
    this.declaimerRepository = DeclaimerModel;
  }

  public async execute(
    declaimer: any,
    session: ClientSession,
    userId: mongoose.Types.ObjectId,
    dbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    try {
      const doc = await this.declaimerRepository
        .updateOne(
          { _id: declaimer._id },
          { $set: { is_active: false, updated_by: userId } },
        )
        .session(session)
        .exec();

      dbTransactions.push(
        await createDbTransaction(
          tableName.Declaimers,
          apiMethods.PATCH,
          operationTypes.deactivate,
          doc,
        ),
      );
    } catch (error) {
      rethrowIfKnown(error, "Error while deactivating declaimer", errorMap);
    }
  }
}

export default new deactivateDeclaimerHelperService();
