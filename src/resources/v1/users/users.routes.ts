import { paramsValidator } from "@/middlewares/request-url-object-id.validation.middleware";
import express from "express";
import { Store } from "./users.controller";
import validationMiddleware, {
  validationSource,
} from "@/middlewares/request-validation.middleware";
import { userValidation } from "./users.validator";

const router = express.Router();

// router.get("/:id", paramsValidator, Show);
router.post(
  "/",
  validationMiddleware(userValidation, validationSource.body),
  Store,
);

router.put("/:id/basic-details", paramsValidator);

export default router;
