import { ApiResponse } from "@/utils/responses/api.response";
import {
  authenticationSessionErrorMessages,
  authenticationSessionSuccessMessages,
} from "./authentication-session.messages";
import { CustomError } from "@/utils/responses/error.response";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { successResponse } from "@/utils/responses/success.response";

export function returnAuthenticationSessionSuccess(
  type: keyof typeof authenticationSessionSuccessMessages,
  data: any = [],
  DbTransaction: DbTransaction[] = [],
) {
  const { message, status } = authenticationSessionSuccessMessages[type];
  return {
    result: successResponse(message, status, data),
    DbTransaction: DbTransaction,
  };
}
export function throwError<T = any>(
  message: keyof typeof authenticationSessionErrorMessages,
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
    path: "userId",
    select: "first_name last_name email phone",
  },
];

export function buildPopulateQuery(reqQuery: any) {
  return {
    ...reqQuery,
    populate: populateFields,
  };
}
