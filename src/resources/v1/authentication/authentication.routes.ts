import express from "express";
const router = express.Router();
import validationMiddleware from "@/middlewares/request-validation.middleware";
import {
  adminLoginValidation,
  refreshTokenValidation,
  sendOtpValidation,
  verifyOtpValidation,
} from "./authentication.validator";
import authenticationController from "./authentication.controller";
import { paramsValidator } from "@/middlewares/request-url-object-id.validation.middleware";
import authenticate from "@/middlewares/authentication-validation.middleware";

router.post("/sent-otp", validationMiddleware(sendOtpValidation), authenticationController.SentOtp);
router.post(
  "/verify-otp/:id",
  paramsValidator,
  validationMiddleware(verifyOtpValidation),
  authenticationController.VerifyOtp,
);

router.post(
  "/refresh-token",
  validationMiddleware(refreshTokenValidation),
  authenticationController.Refresh,
);

router.post("/logout", authenticate, authenticationController.Logout);

router.post("/logout-all", authenticate, authenticationController.LogoutAll);

router.post(
  "/admin-login",
  validationMiddleware(adminLoginValidation),
  authenticationController.AdminLogin,
);

router.post("/login", validationMiddleware(adminLoginValidation), authenticationController.Login);

export default router;
