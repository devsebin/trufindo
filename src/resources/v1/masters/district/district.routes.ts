import routes from "express";
import districtController from "./district.controller";
import validationMiddleware, {
  validationSource,
} from "@/middlewares/request-validation.middleware";
import {
  districtInputValidator,
  updateDistrictInputValidator,
  deleteDistrictInputValidator,
} from "./district.validator";
import { paramsValidator } from "@/middlewares/request-url-object-id.validation.middleware";

const router = routes.Router();

router.post(
  "/",
  validationMiddleware(districtInputValidator),
  districtController.Store,
);

router.get("/", districtController.Index);

router.patch("/:id/enable", paramsValidator, districtController.activate);
router.patch("/:id/disable", paramsValidator, districtController.deactivate);

router.get("/:id", districtController.Show);

router.put(
  "/:id",
  paramsValidator,
  validationMiddleware(updateDistrictInputValidator),
  districtController.Update,
);

router.delete(
  "/:id",
  paramsValidator,
  validationMiddleware(deleteDistrictInputValidator, validationSource.query),
  districtController.Delete,
);

export default router;
