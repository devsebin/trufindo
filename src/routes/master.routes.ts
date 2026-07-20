import { Router } from "express";

import statusRoutes from "@/resources/v1/masters/status/status.routes";
import priorityRoutes from "@/resources/v1/masters/priority/priority.routes";
import providerRoutes from "@/resources/v1/masters/provider/provider.routes";
import districtRoutes from "@/resources/v1/masters/district/district.routes";
const router = Router();
router.use("/statuses", statusRoutes);
router.use("/priorities", priorityRoutes);
router.use("/providers", providerRoutes);
router.use("/districts", districtRoutes);

export default router;
