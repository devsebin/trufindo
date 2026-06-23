import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import findCountryHelperService from "../../../country/helpers/validators/find-country.helper.service";
import { IInputSupportedCountryPayloadStrict } from "../../payloads/provider-payload";
import mongoose from "mongoose";
import { getRequestBody } from "@/utils/helpers/request-body-fetcher.helper";
import { Request } from "express";
import { toLinkCountryDTO } from "../../dto/link-country.dto";
import { providerErrorsMessages } from "../../provider.messages";
import { countryErrorsMessages } from "../../../country/country.messages";

class linkProviderCountryService {
  async execute(
    request: Request,
    payload?: IInputSupportedCountryPayloadStrict,
  ) {
    const DbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();
    const body = getRequestBody(request, payload, toLinkCountryDTO);
    try {
      findCountryHelperService.execute(
        {
          _id: body.countryId,
        },
        countryErrorsMessages,
        {
          throwIfNotFound: true,
          lean: true,
          returnDocument: true,
          session,
        },
      );

      body.countryCode = "";
      return;
    } catch (error) {}
  }
}

export default new linkProviderCountryService();
