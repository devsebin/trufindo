import { IRegion } from "@/database/region/region-db-interface";
import RegionModel from "@/database/region/region-db-model";
import mongoose, { HydratedDocument, Model } from "mongoose";
import { IRegionDTO } from "../../dto/region.dto";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { rethrowIfKnown } from "@/utils/responses/error.response";

class createRegionHelperService {
  private readonly regionRepository: Model<IRegion>;

  constructor() {
    this.regionRepository = RegionModel;
  }

  public async execute(
    payload: Partial<IRegionDTO>,
    session: mongoose.ClientSession,
    DbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<HydratedDocument<IRegion>> {
    try {
      const doc = new this.regionRepository(payload);
      await doc.save({ session });

      DbTransactions.push(
        await createDbTransaction(
          tableName.Regions,
          apiMethods.POST,
          operationTypes.Create,
          doc.toObject(),
        ),
      );
      return doc;
    } catch (error) {
      rethrowIfKnown(error, "Error while creating new region", errorMap);
    }
  }
}

export default new createRegionHelperService();
