import routes from "express";
import statusController from "./status.controller";
import validationMiddleware from "@/middlewares/request-validation.middleware";
import { statusInputValidator } from "./status.validator";
import { paramsValidator } from "@/middlewares/request-url-object-id.validation.middleware";
const router = routes.Router();
router.post(
  "/",
  validationMiddleware(statusInputValidator),
  statusController.Store,
);
router.patch("/:id/enable", paramsValidator, statusController.activate);
router.patch("/:id/disable", paramsValidator, statusController.deactivate);
// router.get("/:id", StatusController.Show);
// router.post("/", StatusController.Store);
// router.put("/:id", StatusController.Update);
// router.delete("/:id", StatusController.Delete);
export default router;
