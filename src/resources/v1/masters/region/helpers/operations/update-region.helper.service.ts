import { IRegion } from "@/database/region/region-db-interface";
import mongoose, { HydratedDocument } from "mongoose";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { IUpdateRegionPayloadStrict } from "../../payloads/create-region.payload";
import { updatedFields } from "@/utils/helpers/update-finder.helper";
import { throwError } from "../../region.helper";
import { ErrorTypes, ResponseBuilder } from "@/utils/helpers/response-builder";
import { regionErrorResponse } from "../../region.response";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { rethrowIfKnown } from "@/utils/responses/error.response";

class updateRegionHelperService {
  constructor() {}

  public async execute(
    id: mongoose.Types.ObjectId,
    payload: IUpdateRegionPayloadStrict,
    existing: HydratedDocument<IRegion>,
    session: mongoose.ClientSession,
    dbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<HydratedDocument<IRegion>> {
    try {
      const changes = updatedFields(payload, existing);
      if (changes.length === 0) {
        const data = regionErrorResponse(existing);
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
      existing.country_id = new mongoose.Types.ObjectId(payload.country_id);

      const saved = await existing.save({ session });

      dbTransactions.push(
        await createDbTransaction(
          tableName.Regions,
          apiMethods.PUT,
          operationTypes.Update,
          saved,
          changes,
        ),
      );

      return saved as HydratedDocument<IRegion>;
    } catch (error) {
      rethrowIfKnown(error, "Error while updating region", errorMap);
    }
  }
}

export default new updateRegionHelperService();
