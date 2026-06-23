// plugins/defaultStatus.plugin.ts
import StatusModel from "../../database/status/status-db-model";
import { Schema } from "mongoose";
import { ErrorTypes, ResponseBuilder } from "../helpers/response-builder";

let cachedDefaultStatusId: any = null;

async function getDefaultStatusId() {
  if (cachedDefaultStatusId) {
    return cachedDefaultStatusId;
  }

  const defaultStatus = await StatusModel.findOne({
    is_default: true,
    is_deleted: false,
    is_active: true,
  }).lean();

  if (!defaultStatus) {
    const response = ResponseBuilder.error(ErrorTypes.BAD_REQUEST, {
      message: "Default status not found",
    });
    throw new Error("Default status not found");
  }

  cachedDefaultStatusId = defaultStatus._id;

  return cachedDefaultStatusId;
}

export function defaultStatusPlugin(schema: Schema) {
  schema.pre("save", async function (next) {
    if (!this.status_id) {
      this.status_id = await getDefaultStatusId();
    }

    next();
  });
}
