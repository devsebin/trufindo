import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import mongoose, { Model } from "mongoose";
import { updatedFields } from "@/utils/helpers/update-finder.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { IPriorities } from "@/database/priority/priority-db-interface";
import { throwError } from "../../priority.helper";
import PriorityModel from "@/database/priority/priority-db-model";

class UnsetPriorityDefaultHelperService {
  private readonly priorityRepository: Model<IPriorities>;

  constructor() {
    this.priorityRepository = PriorityModel;
  }

  public async execute(
    session: mongoose.ClientSession,
    dbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    try {
      // get old document before update
      const existing = await this.priorityRepository
        .findOneAndUpdate(
          {
            is_default: true,
            is_active: true,
            is_deleted: false,
          },
          {
            $set: {
              is_default: false,
            },
          },
          {
            session,
            new: false,
          },
        )
        .exec();

      if (!existing) {
        throwError(
          "no_default_priority_found",
          ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
            message: "No default priority found",
          }),
        );
      }

      // clone old state
      const oldData = existing.toObject();

      // create updated version manually
      const newData = {
        ...oldData,
        is_default: false,
      };

      const changes = updatedFields(oldData, newData);

      dbTransactions.push(
        await createDbTransaction(
          tableName.Priority,
          apiMethods.PUT,
          operationTypes.Update,
          newData,
          changes,
        ),
      );

      return;
    } catch (error) {
      rethrowIfKnown(error, "Error while updating priority", errorMap);
    }
  }
}

export default new UnsetPriorityDefaultHelperService();
