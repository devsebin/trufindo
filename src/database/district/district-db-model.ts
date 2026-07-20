import mongoose, { Schema } from "mongoose";
import IDistrict from "./district-db-interface";
import { tableName } from "@/utils/definitions/constants/table-names";
import { CommonServiceFieldsModel } from "@/utils/definitions/constants/db-constants";
import { defaultStatusPlugin } from "@/utils/plugins/defaultStatus.plugin";

const districtSchema = new Schema<IDistrict>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: tableName.Countries,
      required: false,
      default: null,
    },
    ...CommonServiceFieldsModel,
  },
  { timestamps: true },
);

districtSchema.index(
  { code: 1 },
  {
    unique: true,
    partialFilterExpression: { is_active: true, is_deleted: false },
  },
);

districtSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { is_active: true, is_deleted: false },
  },
);

districtSchema.pre(/^find/, function (next) {
  if (!this.getFilter().hasOwnProperty("is_deleted")) {
    this.where({ is_deleted: false, is_active: true });
  }
  next();
});

districtSchema.plugin(defaultStatusPlugin);

districtSchema.methods.toJSON = function () {
  const districtObject = this.toObject();
  delete districtObject.__v;
  return districtObject;
};

const DistrictModel = mongoose.model<IDistrict>(
  tableName.Districts,
  districtSchema,
);

export default DistrictModel;
