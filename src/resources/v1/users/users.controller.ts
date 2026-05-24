import {
  errorMessages,
  statusCodes,
} from "@/utils/definitions/constants/common";
import { errorResponse } from "@/utils/responses/error.response";
import { JsonResponse } from "@/utils/responses/types";
import { Request, Response } from "express";
import createUserService from "./services/create-user.service";
import createActivityLogService from "../activity-log/services/create-activity-log.service";

export const Store = async (
  req: Request,
  res: Response,
): Promise<JsonResponse | void> => {
  let response: any;
  const start = new Date().getTime();
  try {
    response = await createUserService.execute(req);
    return res.status(response.result.code).json(response.result);
  } catch (error: any) {
    const message = (error as Error).message;
    response = {
      result: errorResponse(
        errorMessages.SomethingWentWrong,
        statusCodes.InternalServerError,
        [message],
      ),
      DbTransactions: [],
    };
    res.status(500).json(response.result);
  } finally {
    const end = new Date().getTime();
    createActivityLogService.execute(req, res, start, end, response);
  }
};
