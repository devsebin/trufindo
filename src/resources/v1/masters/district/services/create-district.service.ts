import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  buildErrorResult,
  ErrorResponse,
} from "@/utils/responses/error.response";
import { SingleResponse } from "@/utils/responses/success.response";
import { Request } from "express";
import mongoose from "mongoose";
import findDistrictHelperService from "../helpers/validators/find-district.helper.service";
import { IInputDistrictPayloadStrict } from "../payloads/create-district.payload";
import { populateFields, districtPayload } from "../district.helper";
import { getRequestBody } from "@/utils/helpers/request-body-fetcher.helper";
import { districtErrorsMessages } from "../district.messages";
import { toDistrictDTO } from "../dto/district.dto";
import createDistrictHelperService from "../helpers/operations/create-district.helper.service";
import { districtResponse } from "../district.response";

class createDistrictService {
  public async execute(
    request: Request,
    payload?: IInputDistrictPayloadStrict,
  ): Promise<SingleResponse | ErrorResponse> {
    const DbTransactions: DbTransaction[] = [];
    const session = await mongoose.startSession();
    const body = getRequestBody(request, payload, toDistrictDTO);

    try {
      session.startTransaction();

      await findDistrictHelperService.execute(
        {
          $or: [
            { name: body.name },
            { code: body.code },
          ],
        } as any,
        districtErrorsMessages,
        {
          throwIfExists: true,
          lean: true,
          returnDocument: false,
        },
      );

      const newDistrict = await createDistrictHelperService.execute(
        body,
        session,
        DbTransactions,
        districtErrorsMessages,
      );

      await newDistrict.populate(populateFields);

      await session.commitTransaction();

      return districtPayload(
        "district_created",
        districtResponse(newDistrict),
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

export default new createDistrictService();
