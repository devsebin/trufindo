import { tableName } from "../../utils/definitions/constants/table-names";
import mongoose, { Schema } from "mongoose";
import { CommonServiceFieldsModel } from "../../utils/definitions/constants/db-constants";

import { defaultStatusPlugin } from "@/utils/plugins/defaultStatus.plugin";
import {
  ICountryProviderConfig,
  IProvider,
  ISupportedCountry,
  ITestLog,
  IType,
} from "./provider-db-interface";

const TestLogSchema = new Schema<ITestLog>(
  {
    date: { type: Date, required: true },
    result: { type: String, enum: ["pass", "fail", "pending"], required: true },
    details: { type: String },
  },
  { _id: false },
);

const CountryProviderConfigSchema = new Schema<ICountryProviderConfig>(
  {
    api_key: String,
    api_secret: String,
    endpoint_url: String,
    timeout_ms: {
      type: Number,
      default: 30000,
    },
    retry_attempts: {
      type: Number,
      default: 3,
    },
    webhook_url: String,
    headers: {
      type: Map,
      of: String,
      default: {},
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

const TypeSchema = new Schema<IType>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  payloadSchema: { type: Schema.Types.Mixed },
  is_tested: { type: Boolean, default: false },
  test_log: { type: [TestLogSchema], default: [] },
  is_default: { type: Boolean, default: false },
  is_active: { type: Boolean, default: false },
});

const SupportedCountrySchema = new Schema<ISupportedCountry>({
  countryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: tableName.Countries,
    required: true,
  },
  countryCode: { type: String, required: true },

  type: { type: [TypeSchema], default: [] },
  supportFrom: { type: Date, required: true },
  supportUntil: { type: Date }, // optional
  is_tested: { type: Boolean, default: false },
  is_active: { type: Boolean, default: false },
});

const ProviderSchema = new Schema<IProvider>(
  {
    name: { type: String, required: true },
    description: { type: String, required: false, default: null },
    supportedCountries: { type: [SupportedCountrySchema], default: [] },
    ...CommonServiceFieldsModel,
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  },
);

ProviderSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      is_active: true,
      is_deleted: false,
    },
  },
);
ProviderSchema.index(
  { name: 1, "supportedCountries.countryCode": 1 },
  { unique: true },
);

ProviderSchema.plugin(defaultStatusPlugin);

export const ProviderModel = mongoose.model<IProvider>(
  tableName.Providers,
  ProviderSchema,
);
