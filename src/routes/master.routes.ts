import { Router } from "express";

import statusRoutes from "@/resources/v1/masters/status/status.routes";
import priorityRoutes from "@/resources/v1/masters/priority/priority.routes";
import providerRoutes from "@/resources/v1/masters/provider/provider.routes";
import regionRoutes from "@/resources/v1/masters/region/region.routes";
import districtRoutes from "@/resources/v1/masters/district/district.routes";
import countryRoutes from "@/resources/v1/masters/country/country.routes";
import { authorization } from "@/middlewares/authorization-validation.middleware";
import authenticate from "@/middlewares/authentication-validation.middleware";

const router = Router();
router.use("/statuses", authenticate, authorization, statusRoutes);
router.use("/priorities", authenticate, authorization, priorityRoutes);
router.use("/providers", authenticate, authorization, providerRoutes);
router.use("/regions", authenticate, authorization, regionRoutes);
router.use("/districts", authenticate, authorization, districtRoutes);
router.use("/countries", authenticate, authorization, countryRoutes);

export default router;
