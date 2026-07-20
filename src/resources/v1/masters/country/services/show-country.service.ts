import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose from "mongoose";
import { countryErrorsMessages } from "../country.messages";
import findCountryHelperService from "../helpers/validators/find-country.helper.service";
import { populateFields, countryPayload } from "../country.helper";
import { countryResponse } from "../country.response";

class showCountryService {
  public async execute(
    id: mongoose.Types.ObjectId,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      const country = await findCountryHelperService.execute(
        { _id: id },
        countryErrorsMessages,
        {
          lean: true,
          throwIfNotFound: true,
          returnDocument: true,
          populate: populateFields,
          session,
        },
      );

      await session.commitTransaction();

      return countryPayload(
        "country_fetched",
        countryResponse(country[0]),
        dbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };

      return buildErrorResult(err.message, countryErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }
}

export default new showCountryService();
