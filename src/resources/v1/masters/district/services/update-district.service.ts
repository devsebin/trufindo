import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import mongoose from "mongoose";
import { Request } from "express";
import findDistrictHelperService from "../helpers/validators/find-district.helper.service";
import { populateFields, districtPayload } from "../district.helper";
import { districtErrorsMessages } from "../district.messages";
import updateDistrictHelperService from "../helpers/operations/update-district.helper.service";
import { IUpdateDistrictPayloadStrict } from "../payloads/create-district.payload";
import { districtResponse } from "../district.response";

class updateDistrictService {
  public async execute(
    id: mongoose.Types.ObjectId,
    request: Request,
    payload?: IUpdateDistrictPayloadStrict,
  ): Promise<SingleResponse | ErrorResponse> {
    const DbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const existing = await findDistrictHelperService.execute(
        { _id: id },
        districtErrorsMessages,
        {
          throwIfNotFound: true,
          lean: false,
          returnDocument: true,
        },
      );

      const body = payload ?? (request.body as IUpdateDistrictPayloadStrict);

      // Check duplicates for name or code (excluding self)
      if ((body.name && body.name !== existing[0].name) || (body.code && body.code.toUpperCase() !== existing[0].code)) {
        const queryOr: any[] = [];
        if (body.name && body.name !== existing[0].name) queryOr.push({ name: body.name });
        if (body.code && body.code.toUpperCase() !== existing[0].code) queryOr.push({ code: body.code.toUpperCase() });

        await findDistrictHelperService.execute(
          {
            $or: queryOr,
            _id: { $ne: id },
          } as any,
          districtErrorsMessages,
          {
            throwIfExists: true,
            lean: true,
            returnDocument: false,
          },
        );
      }

      const updated = await updateDistrictHelperService.execute(
        id,
        body,
        existing[0],
        session,
        DbTransactions,
        districtErrorsMessages,
      );

      await updated.populate(populateFields);

      await session.commitTransaction();

      return districtPayload(
        "district_updated",
        districtResponse(updated),
        DbTransactions,
      );
    } catch (error) {
      await session.abortTransaction();
      const err = error as Error & { data?: any };
      return buildErrorResult(err.message, districtErrorsMessages, err.data);
    } finally {
      session.endSession();
    }
  }
}

export default new updateDistrictService();
