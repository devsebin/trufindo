import { JsonResponse } from "@/utils/responses/types";
import createActivityLogService from "../../activity-log/services/create-activity-log.service";
import { Request, Response } from "express";
import { errorResponse } from "@/utils/responses/error.response";
import {
  errorMessages,
  statusCodes,
} from "@/utils/definitions/constants/common";
import createPriorityService from "./services/create-priority.service";
import deletePriorityService from "./services/delete-priority.service";
import deactivatePriorityService from "./services/disable-priority.service";
import activatePriorityService from "./services/enable-priority.service";
import mongoose from "mongoose";
import showPriorityService from "./services/show-priority.service";
import updatePriorityService from "./services/update-priority.service";
import setDefaultPriorityService from "./services/set-default-priority.service";

class priorityController {
  public async Store(
    req: Request,
    res: Response,
  ): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      response = await createPriorityService.execute(req);
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
      res.status(statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }
  public async Update(
    req: Request,
    res: Response,
  ): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      response = await updatePriorityService.execute(
        new mongoose.Types.ObjectId(req.params.id),
        req,
      );
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
      res.status(statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }
  public async Delete(
    req: Request,
    res: Response,
  ): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const is_force = req.query.force_action ?? false;
      console.log(typeof is_force);
      response = await deletePriorityService.execute(
        new mongoose.Types.ObjectId(req.params.id),
        new mongoose.Types.ObjectId(),
        is_force as boolean,
      );
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
      res.status(statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }
  public async Show(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      response = await showPriorityService.execute(
        new mongoose.Types.ObjectId(req.params.id),
      );
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
      res.status(statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }
  //   public async Index(
  //     req: Request,
  //     res: Response,
  //   ): Promise<JsonResponse | void> {
  //     let response: any;
  //     const start = new Date().getTime();
  //     try {
  //       response = await listStatusService.execute(req, false);
  //       return res.status(response.result.code).json(response.result);
  //     } catch (error: any) {
  //       const message = (error as Error).message;
  //       response = {
  //         result: errorResponse(
  //           errorMessages.SomethingWentWrong,
  //           statusCodes.InternalServerError,
  //           [message],
  //         ),
  //         DbTransactions: [],
  //       };
  //       res.status(statusCodes.InternalServerError).json(response.result);
  //     } finally {
  //       const end = new Date().getTime();
  //       createActivityLogService.execute(req, res, start, end, response);
  //     }
  //   }
  //   public async Search(req: Request, res: Response) {}
  public async activate(
    req: Request,
    res: Response,
  ): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      response = await activatePriorityService.execute(
        new mongoose.Types.ObjectId(req.params.id),
        new mongoose.Types.ObjectId(),
      );
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
      res.status(statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }
  public async deactivate(
    req: Request,
    res: Response,
  ): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      response = await deactivatePriorityService.execute(
        new mongoose.Types.ObjectId(req.params.id),
        new mongoose.Types.ObjectId(),
      );
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
      res.status(statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  public async setDefault(
    req: Request,
    res: Response,
  ): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      response = await setDefaultPriorityService.execute(
        new mongoose.Types.ObjectId(req.params.id),
        new mongoose.Types.ObjectId(),
      );
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
      res.status(statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }
  public async export(req: Request, res: Response) {}
  public async import(req: Request, res: Response) {}
  public async exportTemplate(req: Request, res: Response) {}
}

export default new priorityController();
