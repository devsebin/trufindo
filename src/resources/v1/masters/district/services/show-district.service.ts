import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose from "mongoose";
import { districtErrorsMessages } from "../district.messages";
import findDistrictHelperService from "../helpers/validators/find-district.helper.service";
import { populateFields, districtPayload } from "../district.helper";
import { districtResponse } from "../district.response";

class showDistrictService {
  public async execute(
    id: mongoose.Types.ObjectId,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      const district = await findDistrictHelperService.execute(
        { _id: id },
        districtErrorsMessages,
        {
          lean: true,
          throwIfNotFound: true,
          returnDocument: true,
          populate: populateFields,
        },
      );

      await session.commitTransaction();

      return districtPayload(
        "district_fetched",
        districtResponse(district[0]),
        dbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };

      return buildErrorResult(err.message, districtErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }
}

export default new showDistrictService();
