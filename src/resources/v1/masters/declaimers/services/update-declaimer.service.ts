import { IDeclaimer } from "@/database/declaimers/declaimer-db-interface";
import mongoose from "mongoose";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import { declaimerErrorsMessages } from "../declaimer.messages";
import { returnDeclaimerSuccess, throwError } from "../declaimer.helper";
import { declaimerResponse } from "../declaimer.response";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { updatedFields } from "@/utils/helpers/update-finder.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";

import findDeclaimerHelperService from "../helpers/validators/find-declaimer.helper.service";
import updateDeclaimerHelperService from "../helpers/operations/update-declaimer.helper.service";

class updateDeclaimerService {
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
      const results = await findDeclaimerHelperService.execute(
        { _id: object_id },
        declaimerErrorsMessages,
        { throwIfNotFound: true, session, lean: true },
      );
      const original = results[0];

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
      const newVersionDoc = await updateDeclaimerHelperService.execute(
        original,
        payload,
        session,
        DbTransactions,
        declaimerErrorsMessages,
      );

      await session.commitTransaction();

      return returnDeclaimerSuccess(
        "declaimer_updated",
        declaimerResponse([newVersionDoc]),
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
}

export default new updateDeclaimerService();
