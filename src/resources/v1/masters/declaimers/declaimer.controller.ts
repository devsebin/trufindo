import {
  errorMessages,
  statusCodes,
} from "@/utils/definitions/constants/common";
import { errorResponse } from "@/utils/responses/error.response";
import { JsonResponse } from "@/utils/responses/types";
import { Request, Response } from "express";
import createActivityLogService from "../../activity-log/services/create-activity-log.service";
import createDeclaimerService from "./services/create-declaimer.service";
import { buildPopulateQuery } from "./declaimer.helper";
import listDeclaimerService from "./services/list-declaimer.service";
import showDeclaimerService from "./services/show-declaimer.service";
import mongoose from "mongoose";
import updateDeclaimerService from "./services/update-declaimer.service";
import activateDeclaimerService from "./services/activate-declaimer.service";
import deactivateDeclaimerService from "./services/deactivate-declaimer.service";

class declaimerController {
  async Store(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const object = { ...req.body };
      object.created_by = req.user.id;
      response = await createDeclaimerService.execute(object);
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
  }

  async Index(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const query = buildPopulateQuery(req.query);
      req.query = query;
      response = await listDeclaimerService.execute(req);
      return res.status(response.result.code).json(response.result);
    } catch (error: any) {
      const message = (error as Error).message;
      response = errorResponse(message as string, 500);
      res.status(500).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  async Show(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const id = req.params.id as string;
      response = await showDeclaimerService.execute(
        new mongoose.Types.ObjectId(id),
      );
      return res.status(response.result.code).json(response.result);
    } catch (error: any) {
      const message = (error as Error).message;
      response = {
        result: errorResponse(errorMessages.SomethingWentWrong, 500, [message]),
        DbTransactions: [],
      };
      res.status(response.result.code).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  async Update(req: Request, res: Response): Promise<JsonResponse | void> {
    const start = new Date().getTime();
    let response: any;
    try {
      const object = { ...req.body };
      const query = req.params.id as string;
      object.updated_by = req.user.id;
      response = await updateDeclaimerService.execute(
        new mongoose.Types.ObjectId(query),
        object,
      );
      return res.status(response.result.code).json(response.result);
    } catch (error: any) {
      const message = (error as Error).message;
      response = {
        result: errorResponse(errorMessages.SomethingWentWrong, 500, [message]),
        DbTransactions: [],
      };
      res.status(error.status as number || 500).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  async activate(req: Request, res: Response): Promise<JsonResponse | void> {
    const start = new Date().getTime();
    let response: any;
    try {
      const query = req.params.id as string;
      const userId = req.user.id;
      response = await activateDeclaimerService.execute(
        new mongoose.Types.ObjectId(query),
        new mongoose.Types.ObjectId(userId),
      );
      return res.status(response.result.code).json(response.result);
    } catch (error: any) {
      const message = (error as Error).message;
      response = {
        result: errorResponse(errorMessages.SomethingWentWrong, 500, [message]),
        DbTransactions: [],
      };
      res.status(error.status as number || 500).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  async deactivate(req: Request, res: Response): Promise<JsonResponse | void> {
    const start = new Date().getTime();
    let response: any;
    try {
      const query = req.params.id as string;
      const userId = req.user.id;
      response = await deactivateDeclaimerService.execute(
        new mongoose.Types.ObjectId(query),
        new mongoose.Types.ObjectId(userId),
      );
      return res.status(response.result.code).json(response.result);
    } catch (error: any) {
      const message = (error as Error).message;
      response = {
        result: errorResponse(errorMessages.SomethingWentWrong, 500, [message]),
        DbTransactions: [],
      };
      res.status(error.status as number || 500).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }
}

export default new declaimerController();
