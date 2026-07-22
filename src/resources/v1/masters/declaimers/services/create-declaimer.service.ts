import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import {
  buildErrorResult,
  ErrorResponse,
  rethrowIfKnown,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose, { Model } from "mongoose";
import { declaimerErrorsMessages } from "../declaimer.messages";
import { returnDeclaimerSuccess, throwError } from "../declaimer.helper";
import CountryModel from "@/database/country/country-db-model";
import ICountry from "@/database/country/country-db-interface";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { declaimerResponse } from "../declaimer.response";


class createDeclaimerService {
  private readonly declaimerRepository: Model<IDeclaimer>;
  private readonly countryRepository: Model<ICountry>; // Assuming you have a CountryModel for validation

  constructor() {
    this.declaimerRepository = DeclaimerModel;
    this.countryRepository = CountryModel; // Initialize the country repository
  }

  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Creates a new declaimer
   * @param {IDeclaimer} payload - The payload containing the information of the declaimer
   * @returns {Promise<SingleResponse | ErrorResponse>} - The response containing the created declaimer or an error response
   * @throws {ErrorResponse} - If an error occurs
   */
  /*******  6da237ee-ed38-4cad-b53e-7edcc83a5228  *******/
  public async execute(
    payload: IDeclaimer,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // validations

      await this.validateCountryCode(payload.country, session);
      await this.validateDeclaimer(
        payload.language,
        payload.country,
        payload.key,
        session,
      );
      const version = await this.getNextVersion(
        payload.key,
        payload.language,
        payload.country,
        session,
      );

      payload.version = version;
      // create declaimer
      const document = await this.createDeclaimer(payload, session);

      // commit transaction
      await session.commitTransaction();

      // return success response
      return returnDeclaimerSuccess(
        "declaimer_created",
        declaimerResponse([document]),
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };

      return buildErrorResult(err.message, declaimerErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }

  /*************  ✨helper functions ⭐  *************/

  private async validateCountryCode(
    country_code: string,
    session: mongoose.ClientSession,
  ) {
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
        declaimerErrorsMessages,
      );
    }
  }

  private async validateDeclaimer(
    language: string,
    country: string,
    key: string,
    session: mongoose.ClientSession,
  ) {
    try {
      const declaimerExists = await this.declaimerRepository
        .findOne({ language: language, country: country, key: key })
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
        declaimerErrorsMessages,
      );
    }
  }

  private async getNextVersion(
    key: string,
    language: string,
    country: string,
    session: mongoose.ClientSession,
  ): Promise<number> {
    // Find the highest version for this key + language + country
    const lastDeclaimer = await this.declaimerRepository
      .findOne({ key, language, country })
      .sort({ version: -1 })
      .lean()
      .session(session);

    if (!lastDeclaimer) return 1; // If first version
    return lastDeclaimer.version + 1; // Increment version
  }

  private async createDeclaimer(
    payload: IDeclaimer,
    session: mongoose.ClientSession,
  ) {
    try {
      const doc = await this.declaimerRepository.create([payload], { session });
      if (!doc || doc.length === 0) {
        const response = ResponseBuilder.error(
          ErrorTypes.INTERNAL_SERVER_ERROR,
          {
            message: "Error while creating declaimer",
            data: { declaimerData: payload },
            filler: { declaimerData: payload },
          },
        );
        return throwError("declaimer_not_created", response);
      }
      return doc[0];
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error while creating declaimer",
        declaimerErrorsMessages,
      );
    }
  }
}

export default new createDeclaimerService();
