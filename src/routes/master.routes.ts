import { Router } from "express";

import statusRoutes from "@/resources/v1/masters/status/status.routes";
import priorityRoutes from "@/resources/v1/masters/priority/priority.routes";
import providerRoutes from "@/resources/v1/masters/provider/provider.routes";
const router = Router();
router.use("/statuses", statusRoutes);
router.use("/priorities", priorityRoutes);
router.use("/providers", providerRoutes);

export default router;
