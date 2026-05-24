import { ApiResponse } from "@/utils/responses/api.response";
import { CustomError } from "@/utils/responses/error.response";
import { DbTransaction } from "@/utils/interfaces/activity-log.interface";
import { successResponse } from "@/utils/responses/success.response";
import { userErrorMessages, userSuccessMessages } from "./users.messages";

export function throwError<T = any>(
  message: keyof typeof userErrorMessages,
  data: ApiResponse<T>,
): never {
  const error = new Error() as CustomError;
  error.message = message;
  error.name = "ValidationError";
  error.data = data;
  throw error;
}

export function returnUserSuccess(
  type: keyof typeof userSuccessMessages,
  data: any = [],
  DbTransaction: DbTransaction[] = [],
) {
  const { message, status } = userSuccessMessages[type];
  return {
    result: successResponse(message, status, data),
    DbTransaction: DbTransaction,
  };
}

export const populateFields = [
  {
    path: "declaimer.declaimer_id",
  },
];

export function buildPopulateQuery(reqQuery: any) {
  return {
    ...reqQuery,
    populate: populateFields,
  };
}
