import { Router } from "express";

import statusRoutes from "@/resources/v1/masters/status/status.routes";
import priorityRoutes from "@/resources/v1/masters/priority/priority.routes";
const router = Router();
router.use("/statuses", statusRoutes);
router.use("/priorities", priorityRoutes);

export default router;
