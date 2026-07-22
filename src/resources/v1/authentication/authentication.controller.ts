import {
  errorMessages,
  statusCodes,
} from "@/utils/definitions/constants/common";
import { errorResponse } from "@/utils/responses/error.response";
import { JsonResponse } from "@/utils/responses/types";
import { Request, Response } from "express";
import otpService from "./services/sent-otp.service";
import LoginAdminService from "./services/admin-login.service";
import createActivityLogService from "../activity-log/services/create-activity-log.service";
import verifyOtpService from "./services/verify-otp.service";
import loginService from "./services/login.service";
import mongoose from "mongoose";
import refreshTokenService from "./services/refresh-token.service";
import logoutService from "./services/logout.service";

class authenticationController {
  async Login(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const { email, password } = req.body;
      response = await loginService.execute(email, password);
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
      return res.status(error.status as number || statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  async SentOtp(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const object = { ...req.body };
      response = await otpService.execute(object);
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
      return res.status(error.status as number || statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  async VerifyOtp(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const otp_id = req.params.id;
      const object = { ...req.body };
      response = await verifyOtpService.execute(
        req,
        object,
        new mongoose.Types.ObjectId(otp_id),
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
      return res.status(error.status as number || statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  async Refresh(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const object = req.body.refresh_token;
      response = await refreshTokenService.execute(req, object);
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
      return res.status(error.status as number || statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  async Logout(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const object = req.body.refresh_token;
      response = await logoutService.execute(req, object);
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
      return res.status(error.status as number || statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  async LogoutAll(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const object = req.body.refresh_token;
      response = await logoutService.execute(req, object); // Wait, logoutService does logout-all if we want it, or check logoutService.execute
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
      return res.status(error.status as number || statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }

  async AdminLogin(req: Request, res: Response): Promise<JsonResponse | void> {
    let response: any;
    const start = new Date().getTime();
    try {
      const { email, password } = req.body;
      response = await LoginAdminService.execute(email, password);
      return res.status(response.result.code).json(response.result);
    } catch (error: any) {
      const message = (error as Error).message;
      response = {
        result: errorResponse(errorMessages.SomethingWentWrong, 500, [message]),
        DbTransactions: [],
      };
      return res.status(error.status as number || statusCodes.InternalServerError).json(response.result);
    } finally {
      const end = new Date().getTime();
      createActivityLogService.execute(req, res, start, end, response);
    }
  }
}

export default new authenticationController();
