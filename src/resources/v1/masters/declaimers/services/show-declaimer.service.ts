import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
  rethrowIfKnown,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose, { Model } from "mongoose";
import {
  populateFields,
  returnDeclaimerSuccess,
  throwError,
} from "../declaimer.helper";
import { declaimerErrorsMessages } from "../declaimer.messages";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { declaimerResponse } from "../declaimer.response";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";

class showDeclaimerService {
  private readonly declaimerRepository: Model<IDeclaimer>;

  constructor() {
    this.declaimerRepository = DeclaimerModel;
  }

  async execute(
    object_id: mongoose.Types.ObjectId,
  ): Promise<SingleResponse | ErrorResponse> {
    const DbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();

    try {
      // start transaction
      session.startTransaction();

      // check id
      if (!mongoose.Types.ObjectId.isValid(object_id)) {
        const response = ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
          message: "Invalid declaimer ID",
          data: { declaimerId: object_id },
          filler: { declaimerId: object_id },
        });
        return throwError("invalid_id", response);
      }

      await this.validateDeclaimer(object_id, session);

      const document = await this.fetchDocumentById(
        object_id,
        session,
        DbTransactions,
      );

      // commit transaction
      await session.commitTransaction();

      return returnDeclaimerSuccess(
        "declaimer_fetched",
        declaimerResponse([document]),
        DbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };
      return buildErrorResult(err.message, declaimerErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }

  /*------------------------ Private Methods -----------------*/

  private async validateDeclaimer(
    object_id: mongoose.Types.ObjectId,
    session: mongoose.ClientSession,
  ): Promise<IDeclaimer> {
    try {
      const document = await this.declaimerRepository
        .findById(object_id)
        .session(session)
        .lean();

      if (!document) {
        const response = ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
          message: "Declaimer not found",
          data: { declaimerId: object_id },
          filler: { declaimerId: object_id },
        });
        throwError("declaimer_not_found", response);
      }

      return document;
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error while validating declaimer existence",
        declaimerErrorsMessages,
      );
    }
  }

  private async fetchDocumentById(
    object_id: mongoose.Types.ObjectId,
    session: mongoose.ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<IDeclaimer> {
    try {
      const declaimer = await this.declaimerRepository
        .findById(object_id)
        .populate(populateFields)
        .session(session);

      if (!declaimer) {
        const response = ResponseBuilder.error(ErrorTypes.NOT_FOUND, {
          message: "Declaimer not found",
          data: { declaimerId: object_id },
          filler: { declaimerId: object_id },
        });
        throwError("declaimer_not_found", response);
      }

      dbTransactions.push(
        await createDbTransaction(
          tableName.Declaimers,
          apiMethods.GET,
          operationTypes.Read,
          declaimer,
        ),
      );

      return declaimer;
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error while fetching declaimer by ID",
        declaimerErrorsMessages,
      );
    }
  }
}

export default new showDeclaimerService();
