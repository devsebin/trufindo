import { IDistrict } from "@/database/district/district-db-interface";
import mongoose, { HydratedDocument } from "mongoose";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { IUpdateDistrictPayloadStrict } from "../../payloads/create-district.payload";
import { updatedFields } from "@/utils/helpers/update-finder.helper";
import { throwError } from "../../district.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { districtErrorResponse } from "../../district.response";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { rethrowIfKnown } from "@/utils/responses/error.response";

class updateDistrictHelperService {
  constructor() {}

  public async execute(
    id: mongoose.Types.ObjectId,
    payload: IUpdateDistrictPayloadStrict,
    existing: HydratedDocument<IDistrict>,
    session: mongoose.ClientSession,
    dbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<HydratedDocument<IDistrict>> {
    try {
      const changes = updatedFields(payload, existing);
      if (changes.length === 0) {
        const data = districtErrorResponse(existing);
        throwError(
          "no_change_detected",
          ResponseBuilder.error(ErrorTypes.CONFLICT, {
            message: "No changes detected",
            data,
            filler: { 0: existing.name, 1: existing._id },
          }),
        );
      }

      existing.name = payload.name;
      existing.code = payload.code;
      if (payload.country_id !== undefined) {
        existing.country_id = payload.country_id ? new mongoose.Types.ObjectId(payload.country_id) : undefined;
      }

      const saved = await existing.save({ session });

      dbTransactions.push(
        await createDbTransaction(
          tableName.Districts,
          apiMethods.PUT,
          operationTypes.Update,
          saved,
          changes,
        ),
      );

      return saved as HydratedDocument<IDistrict>;
    } catch (error) {
      rethrowIfKnown(error, "Error while updating district", errorMap);
    }
  }
}

export default new updateDistrictHelperService();
