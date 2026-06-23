import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import { Request } from "express";
import mongoose from "mongoose";
import { getRequestBody } from "@/utils/helpers/request-body-fetcher.helper";
import { IInputIProviderPayloadStrict } from "../payloads/provider-payload";
import { toProviderDTO } from "../dto/create-provider.dto";
import findProviderHelperService from "../helpers/validators/find-provider.helper.service";
import { providerErrorsMessages } from "../provider.messages";
import createProviderHelperService from "../helpers/operations/create-provider.helper.service";
import { populateFields, providerPayload } from "../provider.helper";
import { providerResponse } from "../provider.response";
import findStatusHelperService from "../../status/helpers/validators/find-status.helper.service";

class createProviderService {
  public async execute(
    request: Request,
    payload?: IInputIProviderPayloadStrict,
  ): Promise<SingleResponse | ErrorResponse> {
    const DbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();
    const body = getRequestBody(request, payload, toProviderDTO);

    try {
      session.startTransaction();

      // check if status already exists
      await findProviderHelperService.execute(
        {
          name: body.name,
          is_deleted: false,
        },
        providerErrorsMessages,
        {
          throwIfExists: true,
          lean: true,
          returnDocument: false,
        },
      );

      const pendingStatus = await findStatusHelperService.execute(
        {
          label: "pending",
          is_active: true,
        },
        providerErrorsMessages,
        {
          throwIfNotFound: true,
          lean: true,
          returnDocument: true,
        },
      );

      body.status_id = pendingStatus[0]._id;
      body.is_active = false;
      // create new status
      const newStatus = await createProviderHelperService.execute(
        body,
        session,
        DbTransactions,
        providerErrorsMessages,
      );

      // populate status
      await newStatus.populate(populateFields);

      await session.commitTransaction();

      return providerPayload(
        "provider_created",
        providerResponse(newStatus),
        DbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };
      return buildErrorResult(err.message, providerErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }
}

export default new createProviderService();
