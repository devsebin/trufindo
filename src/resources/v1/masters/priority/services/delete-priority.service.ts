import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose from "mongoose";
import findPriorityHelperService from "../helpers/validators/find-priority.helper.service";
import { priorityErrorsMessages } from "../priority.messages";
import findPriorityStateHelperService from "../helpers/validators/find-priority.state.helper.service";
import deletePriorityHelperService from "../helpers/operations/delete-priority.helper.service";
import { priorityPayload } from "../priority.helper";
class deletePriorityService {
  public async execute(
    id: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    is_force: boolean,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];
    try {
      console.log("is_force", is_force);
      session.startTransaction();
      const priority = await findPriorityHelperService.execute(
        { _id: id },
        priorityErrorsMessages,
        { throwIfNotFound: true, returnDocument: true, session },
      );

      await findPriorityStateHelperService.isAlreadyDeleted(
        priority[0],
        priorityErrorsMessages,
      );

      await findPriorityStateHelperService.IsDefault(
        priority[0],
        priorityErrorsMessages,
      );

      await deletePriorityHelperService.execute(
        priority[0],
        priorityErrorsMessages,
        session,
        dbTransactions,
        userId,
        is_force,
      );

      await session.commitTransaction();

      return priorityPayload("priority_deleted", priority, dbTransactions);
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };

      return buildErrorResult(err.message, priorityErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }
}

export default new deletePriorityService();
