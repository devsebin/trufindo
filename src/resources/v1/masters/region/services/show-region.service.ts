import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose from "mongoose";
import { regionErrorsMessages } from "../region.messages";
import findRegionHelperService from "../helpers/validators/find-region.helper.service";
import { populateFields, regionPayload } from "../region.helper";
import { regionResponse } from "../region.response";

class showRegionService {
  public async execute(
    id: mongoose.Types.ObjectId,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      const region = await findRegionHelperService.execute(
        { _id: id },
        regionErrorsMessages,
        {
          lean: true,
          throwIfNotFound: true,
          returnDocument: true,
          populate: populateFields,
          session,
        },
      );

      await session.commitTransaction();

      return regionPayload(
        "region_fetched",
        regionResponse(region[0]),
        dbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };

      return buildErrorResult(err.message, regionErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }
}

export default new showRegionService();
