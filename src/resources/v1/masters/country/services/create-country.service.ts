import { SingleResponse } from "@/utils/responses/success.response";
import { IInputICountryPayloadStrict } from "../payloads/country-payload";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { Request } from "express";
import { getRequestBody } from "@/utils/helpers/request-body-fetcher.helper";
import { toCountryDTO } from "../dto/create-country.dto";
import mongoose from "mongoose";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { countryErrorsMessages } from "../country.messages";
import findCountryHelperService from "../helpers/validators/find-country.helper.service";
import { countryPayload } from "../country.helper";

class createCountryService {
  public async execute(
    request: Request,
    payload?: IInputICountryPayloadStrict,
  ): Promise<SingleResponse | ErrorResponse> {
    const DbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();
    const body = getRequestBody(request, payload, toCountryDTO);

    try {
      session.startTransaction();

      await findCountryHelperService.execute(
        {
          $or: [
            { name: body.name },
            { iso_code: body.iso_code },
            { iso_code_3: body.iso_code_3 },
          ],
          is_deleted: false,
        },
        countryErrorsMessages,
        {
          throwIfExists: true,
          lean: true,
          returnDocument: false,
        },
      );

      //   const country = await this.countryRepository.create(body, { session });
      await session.commitTransaction();
      return countryPayload("country_created", "country", DbTransactions);
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };
      return buildErrorResult(err.message, countryErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }
}

export default new createCountryService();
