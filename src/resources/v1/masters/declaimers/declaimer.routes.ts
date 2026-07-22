import authenticate from "@/middlewares/authentication-validation.middleware";
import { authorization } from "@/middlewares/authorization-validation.middleware";
import validationMiddleware from "@/middlewares/request-validation.middleware";
import express from "express";
import {
  createDeclaimerValidation,
  updateDeclaimerValidation,
} from "./declaimer.validation";
import { Activate, List, Show, Store, Update } from "./declaimer.controller";
import { paramsValidator } from "@/middlewares/request-url-object-id.validation.middleware";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validationMiddleware(createDeclaimerValidation),
  authorization,
  Store,
);

router.get("/", authenticate, authorization, List);
router.get("/:id", paramsValidator, authenticate, authorization, Show);
router.put(
  "/:id",
  validationMiddleware(updateDeclaimerValidation),
  paramsValidator,
  authenticate,
  authorization,
  Update,
);

router.patch(
  "/:id/activate",
  paramsValidator,
  authenticate,
  authorization,
  Activate,
);

export default router;
