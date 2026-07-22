import mongoose, { Schema, Document } from "mongoose";
import { IDeclaimer } from "./declaimer-db-interface";
import { CommonServiceFieldsModel } from "@/utils/definitions/constants/db-constants";
import { tableName } from "@/utils/definitions/constants/table-names";
import StatusModel from "../status/status-db-model";

const DeclaimerSchema = new Schema<IDeclaimer>(
  {
    key: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    version: {
      type: Number,
      required: true,
    },
    is_latest: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: "en",
      index: true,
    },

    country: {
      type: String,
      default: null,
      index: true,
    },

    published_at: {
      type: Date,
      default: Date.now,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },
    ...CommonServiceFieldsModel,
  },
  {
    timestamps: true,
  },
);

/* ------------------ Indexes ------------------ */

// Ensure unique version per key + language + country
DeclaimerSchema.index(
  { key: 1, language: 1, country: 1, version: -1 },
  { unique: true },
);

// Only one active version per key + language + country
DeclaimerSchema.index(
  { key: 1, language: 1, country: 1, is_latest: 1 },
  { unique: true, partialFilterExpression: { is_latest: true } },
);

DeclaimerSchema.pre(/^find/, function (next) {
  // Only add condition if not already present
  if (!this.getFilter().hasOwnProperty("is_deleted")) {
    this.where({ is_deleted: false });
  }
  next();
});

DeclaimerSchema.pre(/^find/, function (next) {
  // Only add condition if not already present
  if (!this.getFilter().hasOwnProperty("is_active")) {
    this.where({ is_active: true });
  }
  next();
});

DeclaimerSchema.pre<IDeclaimer>("validate", async function (next) {
  if (!this.status_id) {
    const defaultStatus = await StatusModel.findOne({
      is_default: true,
      is_deleted: false,
    }).exec();
    if (!defaultStatus) {
      throw new Error("Default status not found");
    }
    this.status_id = defaultStatus._id;
  }

  next();
});

export const DeclaimerModel = mongoose.model<IDeclaimer>(
  tableName.Declaimers,
  DeclaimerSchema,
);
