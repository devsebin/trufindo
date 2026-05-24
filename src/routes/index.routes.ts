import { Router } from "express";
import userRoutes from "@/resources/v1/users/users.routes";

const router = Router();
router.use("/users", userRoutes);

export default router;
