import { IPriorities } from "@/database/priority/priority-db-interface";
import PriorityModel from "@/database/priority/priority-db-model";
import mongoose, { HydratedDocument, Model } from "mongoose";
import { IPriorityDTO } from "../../dto/priority.dto";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { rethrowIfKnown } from "@/utils/responses/error.response";

class createPriorityHelperService {
  private readonly priorityRepository: Model<IPriorities>;

  constructor() {
    this.priorityRepository = PriorityModel;
  }
  public async execute(
    payload: Partial<IPriorityDTO>,
    session: mongoose.ClientSession,
    DbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<HydratedDocument<IPriorities>> {
    try {
      const doc = new this.priorityRepository(payload);
      await doc.save({ session });

      DbTransactions.push(
        await createDbTransaction(
          tableName.Priority,
          apiMethods.POST,
          operationTypes.Create,
          doc.toObject(),
        ),
      );
      return doc;
    } catch (error) {
      rethrowIfKnown(error, "Error while creating new status", errorMap);
    }
  }
}

export default new createPriorityHelperService();
