import mongoose, { ClientSession, Model } from "mongoose";
import CountryModel from "@/database/country/country-db-model";
import ICountry from "@/database/country/country-db-interface";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { throwError } from "../../declaimer.helper";
import { rethrowIfKnown } from "@/utils/responses/error.response";

class validateDeclaimerStateHelperService {
  private readonly countryRepository: Model<ICountry>;
  private readonly declaimerRepository: Model<IDeclaimer>;

  constructor() {
    this.countryRepository = CountryModel;
    this.declaimerRepository = DeclaimerModel;
  }

  public async validateCountryCode(
    country_code: string,
    session: ClientSession,
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    try {
      if (country_code) {
        const countryExists = await this.countryRepository
          .findOne({ iso_code: country_code })
          .lean()
          .session(session);

        if (!countryExists) {
          const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
            message: "Country not found",
            data: { country_code },
            filler: { country_code },
          });
          return throwError("country_not_found", response);
        }
      }
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error while validating country existence",
        errorMap,
      );
    }
  }

  public async validateDeclaimerUniqueness(
    language: string,
    country: string,
    key: string,
    session: ClientSession,
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    try {
      const declaimerExists = await this.declaimerRepository
        .findOne({ language, country, key })
        .lean()
        .session(session);

      if (declaimerExists) {
        const response = ResponseBuilder.error(ErrorTypes.CONFLICT, {
          message: "Declaimer already exists",
          data: {
            update_allowed: true,
            id: declaimerExists._id,
            title: declaimerExists.title,
            key: declaimerExists.key,
            language: declaimerExists.language,
            country: declaimerExists.country,
          },
        });
        return throwError("declaimer_already_exists", response);
      }
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error while validating declaimer uniqueness",
        errorMap,
      );
    }
  }

  public async isAlreadyActive(
    declaimer: IDeclaimer,
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    if (declaimer.is_active) {
      const response = ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
        message: "Declaimer is already active",
        data: {},
      });
      throwError("declaimer_already_active", response);
    }
  }

  public async isAlreadyInactive(
    declaimer: IDeclaimer,
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<void> {
    if (!declaimer.is_active) {
      const response = ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
        message: "Declaimer is already inactive",
        data: {},
      });
      throwError("declaimer_already_inactive", response);
    }
  }
}

export default new validateDeclaimerStateHelperService();
