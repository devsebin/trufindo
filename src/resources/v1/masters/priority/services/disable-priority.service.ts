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
import deactivatePriorityHelperService from "../helpers/operations/disable-priority.helper.service";
import { priorityPayload } from "../priority.helper";

class deactivatePriorityService {
  public async execute(
    id: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      const status = await findPriorityHelperService.execute(
        { _id: id },
        priorityErrorsMessages,
        { lean: true, throwIfNotFound: true, returnDocument: true, session },
      );

      await findPriorityStateHelperService.isAlreadyInactive(
        status[0],
        priorityErrorsMessages,
      );

      await findPriorityStateHelperService.IsDefault(
        status[0],
        priorityErrorsMessages,
      );

      const updatedDocument = await deactivatePriorityHelperService.execute(
        status[0],
        session,
        dbTransactions,
        priorityErrorsMessages,
        userId,
      );

      await session.commitTransaction();

      return priorityPayload(
        "priority_deactivated",
        updatedDocument,
        dbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };
      return buildErrorResult(err.message, priorityErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }
}

export default new deactivatePriorityService();
