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
import setDefaultPriorityHelperService from "../helpers/operations/set-default.helper.service";
import { priorityPayload } from "../priority.helper";
import UnsetPriorityDefaultHelperService from "../helpers/operations/unset-default.helper.service";

class setDefaultPriorityService {
  public async execute(
    id: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      const document = await findPriorityHelperService.execute(
        { _id: id },
        priorityErrorsMessages,
        { lean: true, throwIfNotFound: true, returnDocument: true, session },
      );

      await UnsetPriorityDefaultHelperService.execute(
        session,
        dbTransactions,
        priorityErrorsMessages,
      );

      const updatedDocument = await setDefaultPriorityHelperService.execute(
        document[0],
        session,
        dbTransactions,
        priorityErrorsMessages,
        userId,
      );

      await session.commitTransaction();

      return priorityPayload(
        "default_priority_set",
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

export default new setDefaultPriorityService();
