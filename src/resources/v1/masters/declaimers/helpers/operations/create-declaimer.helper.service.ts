import mongoose, { ClientSession, Model } from "mongoose";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { throwError } from "../../declaimer.helper";
import { rethrowIfKnown } from "@/utils/responses/error.response";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";

class createDeclaimerHelperService {
  private readonly declaimerRepository: Model<IDeclaimer>;

  constructor() {
    this.declaimerRepository = DeclaimerModel;
  }

  public async execute(
    payload: IDeclaimer,
    session: ClientSession,
    dbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<IDeclaimer> {
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

      const declaimerDoc = doc[0];

      dbTransactions.push(
        await createDbTransaction(
          tableName.Declaimers,
          apiMethods.POST,
          operationTypes.Create,
          declaimerDoc,
        ),
      );

      return declaimerDoc;
    } catch (error) {
      rethrowIfKnown(error, "Error while creating declaimer", errorMap);
      return null as any;
    }
  }
}

export default new createDeclaimerHelperService();
