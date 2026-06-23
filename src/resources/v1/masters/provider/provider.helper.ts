import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import {
  providerErrorsMessages,
  providerSuccessMessages,
} from "./provider.messages";
import { successResponse } from "@/utils/responses/success.response";
import { CustomError } from "@/utils/responses/error.response";
import { ApiResponse } from "@/utils/responses/api.response";

export function providerPayload(
  type: keyof typeof providerSuccessMessages,
  data: any = [],
  DbTransaction: DbTransaction[] = [],
) {
  const { message, status } = providerSuccessMessages[type];
  return {
    result: successResponse(message, status, data),
    DbTransaction: DbTransaction,
  };
}

export function throwError<T = any>(
  message: keyof typeof providerErrorsMessages,
  data: ApiResponse<T>,
): never {
  const error = new Error() as CustomError;
  error.message = message;
  error.name = "ValidationError";
  error.data = data;
  throw error;
}

export const populateFields = [
  {
    path: "created_by",
    select: "first_name last_name email",
  },
  {
    path: "updated_by",
    select: "first_name last_name email",
  },
  {
    path: "deleted_by",
    select: "first_name last_name email",
  },
  {
    path: "status_id",
    select: "title",
  },
];
export function buildPopulateQuery(reqQuery: any) {
  return {
    ...reqQuery,
    populate: populateFields,
  };
}
