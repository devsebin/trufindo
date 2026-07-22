import authenticate from "@/middlewares/authentication-validation.middleware";
import { authorization } from "@/middlewares/authorization-validation.middleware";
import validationMiddleware from "@/middlewares/request-validation.middleware";
import express from "express";
import {
  createDeclaimerValidation,
  updateDeclaimerValidation,
} from "./declaimer.validator";
import declaimerController from "./declaimer.controller";
import { paramsValidator } from "@/middlewares/request-url-object-id.validation.middleware";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validationMiddleware(createDeclaimerValidation),
  authorization,
  declaimerController.Store,
);

router.get("/", authenticate, authorization, declaimerController.Index);

router.get("/:id", paramsValidator, authenticate, authorization, declaimerController.Show);

router.put(
  "/:id",
  validationMiddleware(updateDeclaimerValidation),
  paramsValidator,
  authenticate,
  authorization,
  declaimerController.Update,
);

router.patch(
  "/:id/activate",
  paramsValidator,
  authenticate,
  authorization,
  declaimerController.activate,
);

router.patch(
  "/:id/deactivate",
  paramsValidator,
  authenticate,
  authorization,
  declaimerController.deactivate,
);

export default router;
