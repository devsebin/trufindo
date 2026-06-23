import express from "express";
import providerController from "./provider.controller";
import validationMiddleware from "@/middlewares/request-validation.middleware";
import {
  providerInputValidationSchema,
  supportedCountryInputValidationSchema,
} from "./provider.validator";
const router = express.Router();

router.post(
  "/",
  validationMiddleware(providerInputValidationSchema),
  providerController.Store,
);

router.get("/", providerController.Index);
router.get("/search", providerController.Search);
router.get("/import", providerController.import);
router.get("/export", providerController.export);
router.get("/export-template", providerController.exportTemplate);
router.get("/:id", providerController.Show);
router.put("/:id", providerController.Update);
router.delete("/:id", providerController.Delete);
router.patch("/:id/enable", providerController.activate);
router.patch("/:id/disable", providerController.deactivate);

// supporting countries
router.put(
  "/:id/link-countries",
  validationMiddleware(supportedCountryInputValidationSchema),
  providerController.linkCountries,
);
router.get(
  "/:id/unlink-countries/:country_id",
  providerController.unlinkCountries,
);

// supporting services types

router.get("/:id/link-services/:country_id", providerController.linkServices);
router.get(
  "/:id/unlink-services/:country_id/service/:service_id",
  providerController.linkServices,
);
router.get(
  "/:id/test/:country_id/service/:service_id",
  providerController.linkServices,
);

export default router;
