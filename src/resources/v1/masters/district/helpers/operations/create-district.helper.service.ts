import { IDistrict } from "@/database/district/district-db-interface";
import DistrictModel from "@/database/district/district-db-model";
import mongoose, { HydratedDocument, Model } from "mongoose";
import { IDistrictDTO } from "../../dto/district.dto";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { createDbTransaction } from "@/utils/helpers/db-transaction.helper";
import { tableName } from "@/utils/definitions/constants/table-names";
import { apiMethods } from "@/utils/definitions/constants/api-methods";
import { operationTypes } from "@/utils/definitions/constants/operation-types";
import { rethrowIfKnown } from "@/utils/responses/error.response";

class createDistrictHelperService {
  private readonly districtRepository: Model<IDistrict>;

  constructor() {
    this.districtRepository = DistrictModel;
  }

  public async execute(
    payload: Partial<IDistrictDTO>,
    session: mongoose.ClientSession,
    DbTransactions: DbTransaction[],
    errorMap: Record<string, { message: string; status: number }>,
  ): Promise<HydratedDocument<IDistrict>> {
    try {
      const doc = new this.districtRepository(payload);
      await doc.save({ session });

      DbTransactions.push(
        await createDbTransaction(
          tableName.Districts,
          apiMethods.POST,
          operationTypes.Create,
          doc.toObject(),
        ),
      );
      return doc;
    } catch (error) {
      rethrowIfKnown(error, "Error while creating new district", errorMap);
    }
  }
}

export default new createDistrictHelperService();
