import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose from "mongoose";
import findPriorityHelperService from "../helpers/validators/find-priority.helper.service";
import { priorityErrorsMessages } from "../priority.messages";
import { populateFields, priorityPayload } from "../priority.helper";
import { priorityResponse } from "../priority.response";

class showPriorityService {
  public async execute(
    id: mongoose.Types.ObjectId,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      const priority = await findPriorityHelperService.execute(
        { _id: id },
        priorityErrorsMessages,
        {
          throwIfNotFound: true,
          returnDocument: true,
          populate: populateFields,
        },
      );

      await session.commitTransaction();

      return priorityPayload(
        "priority_fetched",
        priorityResponse(priority[0]),
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

export default new showPriorityService();
