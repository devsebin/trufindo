import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import mongoose, { HydratedDocument } from "mongoose";
import { updatedFields } from "@/utils/helpers/update-finder.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { IUpdatePriorityPayloadStrict } from "../../payloads/priority-payload";
import { IPriorities } from "@/database/priority/priority-db-interface";
import { priorityErrorResponse } from "../../priority.response";
import { throwError } from "../../priority.helper";

class updatePriorityHelperService {
  constructor() {}
  public async execute(
    id: mongoose.Types.ObjectId,
    payload: IUpdatePriorityPayloadStrict,
    existing: HydratedDocument<IPriorities>,
    session: mongoose.ClientSession,
    dbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<HydratedDocument<IPriorities>> {
    try {
      const changes = updatedFields(payload, existing);
      if (changes.length === 0) {
        const data = priorityErrorResponse(existing);
        throwError(
          "no_change_detected",
          ResponseBuilder.error(ErrorTypes.CONFLICT, {
            message: "No changes detected",
            data,
            filler: { 0: existing.label, 1: existing._id },
          }),
        );
      }

      // Only update the fields that have changed
      existing.title = payload.title;
      existing.color = payload.color;
      existing.label = payload.label;

      const saved = await existing.save({ session });

      dbTransactions.push(
        await createDbTransaction(
          tableName.Priority,
          apiMethods.PUT,
          operationTypes.Update,
          saved,
          changes,
        ),
      );

      return saved as HydratedDocument<IPriorities>;
    } catch (error) {
      rethrowIfKnown(error, "Error while updating priority", errorMap);
    }
  }
}

export default new updatePriorityHelperService();
