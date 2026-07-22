import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import mongoose from "mongoose";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import { declaimerErrorsMessages } from "../declaimer.messages";
import { returnDeclaimerSuccess } from "../declaimer.helper";
import { declaimerResponse } from "../declaimer.response";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";

import validateDeclaimerStateHelperService from "../helpers/validators/validate-declaimer-state.helper.service";
import getDeclaimerVersionHelperService from "../helpers/validators/get-declaimer-version.helper.service";
import createDeclaimerHelperService from "../helpers/operations/create-declaimer.helper.service";

class createDeclaimerService {
  public async execute(
    payload: IDeclaimer,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      // validations
      await validateDeclaimerStateHelperService.validateCountryCode(
        payload.country,
        session,
        declaimerErrorsMessages,
      );

      await validateDeclaimerStateHelperService.validateDeclaimerUniqueness(
        payload.language,
        payload.country,
        payload.key,
        session,
        declaimerErrorsMessages,
      );

      const version = await getDeclaimerVersionHelperService.execute(
        payload.key,
        payload.language,
        payload.country,
        session,
      );

      payload.version = version;

      // create declaimer
      const document = await createDeclaimerHelperService.execute(
        payload,
        session,
        dbTransactions,
        declaimerErrorsMessages,
      );

      // commit transaction
      await session.commitTransaction();

      // return success response
      return returnDeclaimerSuccess(
        "declaimer_created",
        declaimerResponse([document]),
        dbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };

      return buildErrorResult(err.message, declaimerErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }
}

export default new createDeclaimerService();
