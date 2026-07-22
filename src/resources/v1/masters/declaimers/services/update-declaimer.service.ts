import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
  rethrowIfKnown,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose, { ClientSession, Model } from "mongoose";
import { returnDeclaimerSuccess, throwError } from "../declaimer.helper";
import { updatedFields } from "@/utils/helpers/update-finder.helper";
import { declaimerErrorsMessages } from "../declaimer.messages";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";

class updateDeclaimerService {
  private readonly declaimerRepository: Model<IDeclaimer>;

  constructor() {
    this.declaimerRepository = DeclaimerModel;
  }

  async execute(
    object_id: mongoose.Types.ObjectId,
    payload: Partial<IDeclaimer>,
  ): Promise<SingleResponse | ErrorResponse> {
    const DbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // ✅ Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(object_id)) {
        const response = ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
          message: "Invalid declaimer ID",
          data: { declaimerId: object_id },
          filler: { declaimerId: object_id },
        });
        return throwError("invalid_id", response);
      }

      // ✅ Get existing declaimer
      const original = await this.validateDeclaimer(object_id, session);

      // ✅ Detect changes
      const changes = updatedFields(payload, original);
      if (changes.length === 0) {
        const response = ResponseBuilder.error(ErrorTypes.VALIDATION_ERROR, {
          message: "No changes detected",
          data: { declaimerId: object_id },
          filler: { declaimerId: object_id },
        });
        return throwError("no_changes_detected", response);
      }

      // ✅ Create new version
      const newVersionDoc = await this.createNewVersion(
        original,
        payload,
        session,
        DbTransactions,
      );

      await session.commitTransaction();

      return returnDeclaimerSuccess(
        "declaimer_updated",
        newVersionDoc,
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
    session: ClientSession,
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

  private async getNextVersion(
    key: string,
    language: string,
    country: string,
    session: ClientSession,
  ): Promise<number> {
    const lastDoc = await this.declaimerRepository
      .findOne({ key, language, country })
      .sort({ version: -1 })
      .session(session);

    return lastDoc ? lastDoc.version + 1 : 1;
  }

  private async createNewVersion(
    original: IDeclaimer,
    payload: Partial<IDeclaimer>,
    session: ClientSession,
    dbTransactions: DbTransaction[],
  ): Promise<IDeclaimer> {
    try {
      // ✅ Get next version
      const nextVersion = await this.getNextVersion(
        original.key,
        original.language,
        original.country,
        session,
      );

      // ✅ Mark old versions as NOT latest
      await this.declaimerRepository.updateMany(
        {
          key: original.key,
          language: original.language,
          country: original.country,
          is_latest: true,
        },
        { $set: { is_latest: false } },
        { session },
      );

      // ✅ Build new document
      const newPayload = {
        ...original,
        ...payload,
        _id: new mongoose.Types.ObjectId(), // force new document
        version: nextVersion,
        is_latest: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const created = await this.declaimerRepository.create([newPayload], {
        session,
      });

      if (!created || created.length === 0) {
        const response = ResponseBuilder.error(
          ErrorTypes.INTERNAL_SERVER_ERROR,
          {
            message: "Failed to create new declaimer version",
            data: {},
            filler: {},
          },
        );
        throwError("declaimer_not_created", response);
      }

      const newDoc = created[0];

      // ✅ Track changes
      const finalChanges = updatedFields(newDoc.toObject(), original);

      // ✅ Audit log
      dbTransactions.push(
        await createDbTransaction(
          tableName.Declaimers,
          apiMethods.POST,
          operationTypes.Create,
          newDoc,
          finalChanges,
        ),
      );

      return newDoc;
    } catch (error) {
      rethrowIfKnown(
        error,
        "Error while creating new declaimer version",
        declaimerErrorsMessages,
      );
    }
  }
}

export default new updateDeclaimerService();
