import {
  errorMessages,
  statusCodes,
} from "@/utils/definitions/constants/common";
import { errorResponse } from "@/utils/responses/error.response";
import { JsonResponse } from "@/utils/responses/types";
import { Request, Response } from "express";
import createActivityLogService from "../../activity-log/services/create-activity-log.service";
import createCountryService from "./services/create-country.service";

class countryController {
  async Index(req: Request, res: Response) {}
  async Store(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      response = await createCountryService.execute(req);
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
  async Show(req: Request, res: Response) {}
  async Update(req: Request, res: Response) {}
  async Delete(req: Request, res: Response) {}
  async Search(req: Request, res: Response) {}
  async import(req: Request, res: Response) {}
  async export(req: Request, res: Response) {}
  async exportTemplate(req: Request, res: Response) {}
  async activate(req: Request, res: Response) {}
  async deactivate(req: Request, res: Response) {}
}

export default new countryController();
