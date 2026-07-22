import {
  errorMessages,
  statusCodes,
} from "@/utils/definitions/constants/common";
import { errorResponse } from "@/utils/responses/error.response";
import { JsonResponse } from "@/utils/responses/types";
import { Request, Response } from "express";
import createActivityLogService from "../activity-log/services/create-activity-log.service";
import createAuthenticationSessionService from "./services/create-authentication-session.service";
import { buildPopulateQuery } from "./authentication-session.helper";
import listAuthenticationSessionService from "./services/list-authentication-session.service";

export const Store = async (
  req: Request,
  res: Response,
): Promise<JsonResponse | void> => {
  let response: any;
  const start = new Date().getTime();
  try {
    response = await createAuthenticationSessionService.execute(req);
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
export const List = async (
  req: Request,
  res: Response,
): Promise<JsonResponse | void> => {
  let response: any;
  const start = new Date().getTime();
  try {
    const query = buildPopulateQuery(req.query);
    req.query = query;
    response = await listAuthenticationSessionService.execute(req);
    return res.status(response.result.code).json(response.result);
  } catch (error: any) {
    console.log(error);
    const message = (error as Error).message;
    response = errorResponse(message as string, 500);
    res.status(500).json(response.result);
  } finally {
    const end = new Date().getTime();
    createActivityLogService.execute(req, res, start, end, response);
  }
};

export const Show = async (
  req: Request,
  res: Response,
): Promise<JsonResponse | void> => {
  let response: any;
  const start = new Date().getTime();
  try {
    const query = buildPopulateQuery(req.query);
    req.query = query;
    response = await listAuthenticationSessionService.execute(req);
    return res.status(response.result.code).json(response.result);
  } catch (error: any) {
    console.log(error);
    const message = (error as Error).message;
    response = errorResponse(message as string, 500);
    res.status(500).json(response.result);
  } finally {
    const end = new Date().getTime();
    createActivityLogService.execute(req, res, start, end, response);
  }
};
