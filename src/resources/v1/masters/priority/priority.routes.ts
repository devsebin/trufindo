import routes from "express";

import { paramsValidator } from "@/middlewares/request-url-object-id.validation.middleware";
import validationMiddleware, {
  validationSource,
} from "@/middlewares/request-validation.middleware";
import {
  deletePriorityQueryValidator,
  PriorityInputValidator,
  updatePriorityQueryValidator,
} from "./priority.validator";
import priorityController from "./priority.controller";
const router = routes.Router();
router.post(
  "/",
  validationMiddleware(PriorityInputValidator),
  priorityController.Store,
);
// router.get("/", statusController.Index);
router.patch("/:id/enable", paramsValidator, priorityController.activate);
router.patch("/:id/disable", paramsValidator, priorityController.deactivate);
router.patch(
  "/:id/set-default",
  paramsValidator,
  priorityController.setDefault,
);
router.get("/:id", priorityController.Show);
router.put(
  "/:id",
  paramsValidator,
  validationMiddleware(updatePriorityQueryValidator, validationSource.body),
  priorityController.Update,
);
router.delete(
  "/:id",
  paramsValidator,
  validationMiddleware(deletePriorityQueryValidator, validationSource.query),
  priorityController.Delete,
);
export default router;
