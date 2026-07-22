import mongoose, { ClientSession, Model } from "mongoose";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import CountryModel from "@/database/country/country-db-model";
import { throwError } from "../../authentication.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { authenticationErrors } from "../../authentication.messages";

class normalizePhoneHelperService {
  private readonly countryRepository: Model<any>;

  constructor() {
    this.countryRepository = CountryModel;
  }

  public async execute(
    phone: string,
    countryCode: string,
    session: ClientSession,
  ): Promise<string> {
    try {
      const country = await this.countryRepository
        .findOne({ iso_code: countryCode.toUpperCase() })
        .session(session);

      if (!country) {
        const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
          message: "Country not found for the provided country code",
          data: { countryCode },
          filler: { countryCode },
        });
        throwError("country_not_found", response);
      }

      const phoneNumber = parsePhoneNumberFromString(
        phone,
        countryCode.toUpperCase() as any,
      );

      if (!phoneNumber || !phoneNumber.isValid()) {
        const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
          message: "Invalid phone number format",
          data: { phoneNumber: phone, countryCode: countryCode.toUpperCase() },
          filler: {
            phoneNumber: phone,
            countryCode: countryCode.toUpperCase(),
          },
        });
        throwError("invalid_phone_number", response);
      }

      if (phoneNumber!.country !== countryCode.toUpperCase()) {
        const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
          message: "Phone number does not match the provided country code",
          data: { phoneNumber: phone, countryCode },
          filler: { phoneNumber: phone, countryCode },
        });
        throwError("phone_country_mismatch", response);
      }

      return phoneNumber!.number; // normalized E.164
    } catch (error) {
      rethrowIfKnown(error, "Error normalizing phone", authenticationErrors);
      return "";
    }
  }
}

export default new normalizePhoneHelperService();
