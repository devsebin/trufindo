import { SingleResponse } from "@/utils/responses/success.response";
import { IInputPriorityPayloadStrict } from "../payloads/priority-payload";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import mongoose from "mongoose";
import { getRequestBody } from "@/utils/helpers/request-body-fetcher.helper";
import { Request } from "express";
import { toPriorityDTO } from "../dto/priority.dto";
import findPriorityHelperService from "../helpers/validators/find-priority.helper.service";
import { priorityErrorsMessages } from "../priority.messages";
import createPriorityHelperService from "../helpers/operations/create-priority.helper.service";
import findPriorityDefaultSetterHelperService from "../helpers/validators/find-default.helper.service";
import { populateFields, priorityPayload } from "../priority.helper";
import { priorityResponse } from "../priority.response";

class createPriorityService {
  public async execute(
    request: Request,
    payload?: IInputPriorityPayloadStrict,
  ): Promise<SingleResponse | ErrorResponse> {
    const DbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();
    const body = getRequestBody(request, payload, toPriorityDTO);

    try {
      session.startTransaction();

      // check if already exists
      await findPriorityHelperService.execute(
        {
          label: body.label,
          is_active: true,
        },
        priorityErrorsMessages,
        {
          throwIfExists: true,
          lean: true,
          returnDocument: false,
        },
      );

      const bodyWithDefault =
        await findPriorityDefaultSetterHelperService.execute(
          body,
          priorityErrorsMessages,
          { setDefault: true, session },
        );

      const newDocument = await createPriorityHelperService.execute(
        bodyWithDefault,
        session,
        DbTransactions,
        priorityErrorsMessages,
      );

      // populate status
      await newDocument.populate(populateFields);

      await session.commitTransaction();

      return priorityPayload(
        "priority_created",
        priorityResponse(newDocument),
        DbTransactions,
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

export default new createPriorityService();
