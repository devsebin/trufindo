import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose from "mongoose";
import { getRequestBody } from "@/utils/helpers/request-body-fetcher.helper";
import { Request } from "express";
import { IUpdatePriorityPayloadStrict } from "../payloads/priority-payload";
import { toPriorityDTO } from "../dto/priority.dto";
import findPriorityHelperService from "../helpers/validators/find-priority.helper.service";
import { priorityErrorsMessages } from "../priority.messages";
import updatePriorityHelperService from "../helpers/operations/update-priority.helper.service";
import { priorityPayload } from "../priority.helper";

class updatePriorityService {
  public async execute(
    id: mongoose.Types.ObjectId,
    request: Request,
    payload?: IUpdatePriorityPayloadStrict,
  ): Promise<SingleResponse | ErrorResponse> {
    const dbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();
    const body = getRequestBody(request, payload, toPriorityDTO);

    try {
      session.startTransaction();

      const document = await findPriorityHelperService.execute(
        { _id: id },
        priorityErrorsMessages,
        { throwIfNotFound: true, returnDocument: true, session },
      );

      // ✅ Perform the update
      const updatedDocument = await updatePriorityHelperService.execute(
        id,
        body,
        document[0],
        session,
        dbTransactions,
        priorityErrorsMessages,
      );

      await session.commitTransaction();

      return priorityPayload(
        "priority_updated",
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

export default new updatePriorityService();
