import mongoose, { ClientSession, Model } from "mongoose";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { throwError } from "../../declaimer.helper";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { updatedFields } from "@/utils/helpers/update-finder.helper";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import getDeclaimerVersionHelperService from "../validators/get-declaimer-version.helper.service";

class updateDeclaimerHelperService {
  private readonly declaimerRepository: Model<IDeclaimer>;

  constructor() {
    this.declaimerRepository = DeclaimerModel;
  }

  public async execute(
    original: IDeclaimer,
    payload: Partial<IDeclaimer>,
    session: ClientSession,
    dbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<IDeclaimer> {
    try {
      // ✅ Get next version
      const nextVersion = await getDeclaimerVersionHelperService.execute(
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
        errorMap,
      );
      return null as any;
    }
  }
}

export default new updateDeclaimerHelperService();
