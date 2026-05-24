import { Router } from "express";

import statusRoutes from "@/resources/v1/masters/status/status.routes";
const router = Router();
router.use("/statuses", statusRoutes);

export default router;
