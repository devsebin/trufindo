import { IPriorities } from "@/database/priority/priority-db-interface";
import PriorityModel from "@/database/priority/priority-db-model";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { tableName } from "@/utils/definitions/constants/table-names";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { updatedFields } from "@/utils/helpers/update-finder.helper";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import mongoose, { HydratedDocument, Model } from "mongoose";

class setDefaultPriorityHelperService {
  private readonly priorityRepository = Model<IPriorities>;

  constructor() {
    this.priorityRepository = PriorityModel;
  }
  async execute(
    priority: HydratedDocument<IPriorities>,
    session: mongoose.ClientSession,
    DbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
    updated_by: mongoose.Types.ObjectId,
  ): Promise<HydratedDocument<IPriorities>> {
    const snapshot = priority;
    try {
      const updatedDocument = await this.priorityRepository.findOneAndUpdate(
        { _id: priority._id },
        {
          $set: {
            is_deleted: false,
            updated_by: updated_by,
            is_active: true,
            is_default: true,
          },
        },
        { session, new: true },
      );
      const changes = updatedFields(updatedDocument, snapshot);

      DbTransactions.push(
        await createDbTransaction(
          tableName.Priority,
          apiMethods.PATCH,
          operationTypes.activate,
          updatedDocument,
          changes,
        ),
      );

      return updatedDocument as HydratedDocument<IPriorities>;
    } catch (error) {
      rethrowIfKnown(error, "Error while setting default priority", errorMap);
    }
  }
}

export default new setDefaultPriorityHelperService();
