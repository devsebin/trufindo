import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose from "mongoose";
import findDeclaimerHelperService from "../helpers/validators/find-declaimer.helper.service";
import validateDeclaimerStateHelperService from "../helpers/validators/validate-declaimer-state.helper.service";
import deactivateDeclaimerHelperService from "../helpers/operations/deactivate-declaimer.helper.service";
import { returnDeclaimerSuccess } from "../declaimer.helper";
import { declaimerResponse } from "../declaimer.response";
import { declaimerErrorsMessages } from "../declaimer.messages";

class disableDeclaimerService {
  public async execute(
    id: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
  ): Promise<SingleResponse | ErrorResponse> {
    const session = await mongoose.startSession();
    const dbTransactions: DbTransaction[] = [];

    try {
      session.startTransaction();

      const declaimers = await findDeclaimerHelperService.execute(
        {
          _id: id,
        } as any,
        declaimerErrorsMessages,
        { throwIfNotFound: true, returnDocument: true, session },
      );
      const declaimer = declaimers[0];

      await validateDeclaimerStateHelperService.isAlreadyInactive(
        declaimer,
        declaimerErrorsMessages,
      );

      await deactivateDeclaimerHelperService.execute(
        declaimer,
        session,
        userId,
        dbTransactions,
        declaimerErrorsMessages,
      );

      await session.commitTransaction();

      return returnDeclaimerSuccess("declaimer_deactivate", declaimerResponse([declaimer]), dbTransactions);
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };

      return buildErrorResult(err.message, declaimerErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }
}

export default new disableDeclaimerService();
