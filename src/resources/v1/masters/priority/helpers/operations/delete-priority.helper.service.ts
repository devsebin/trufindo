import { IPriorities } from "@/database/priority/priority-db-interface";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { tableName } from "@/utils/definitions/constants/table-names";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { updatedFields } from "@/utils/helpers/update-finder.helper";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import mongoose, { HydratedDocument, Model } from "mongoose";
import { throwError } from "../../priority.helper";
import { ActionTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { priorityErrorResponse } from "../../priority.response";

class deletePriorityHelperService {
  async execute(
    priority: HydratedDocument<IPriorities>,
    errorMap: Record<string, { message: string; status: number }>,
    session: mongoose.ClientSession,
    DbTransactions: DbTransaction[],
    owner: mongoose.Types.ObjectId,
    is_force: boolean = false,
  ): Promise<void> {
    try {
      if (!is_force && priority.is_active) {
        throwError(
          "confirmation_required",
          ResponseBuilder.actionRequired(
            ActionTypes.CONFIRM_DELETE,
            "Are you sure you want to delete this Priority?",
            true,
            priorityErrorResponse(priority),
          ),
        );
      }

      const snapshot = priority;
      priority.is_deleted = true;
      priority.deleted_by = owner;
      priority.updated_by = owner;
      priority.is_active = false;
      await priority.save({ session });

      const changes = updatedFields(priority, snapshot);
      DbTransactions.push(
        await createDbTransaction(
          tableName.Priority,
          apiMethods.DELETE,
          operationTypes.Delete,
          priority.toObject(),
          changes,
        ),
      );
    } catch (error) {
      rethrowIfKnown(error, "Error while deleting priority", errorMap);
    }
  }
}

export default new deletePriorityHelperService();
