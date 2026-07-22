import { Router } from "express";
import userRoutes from "@/resources/v1/users/users.routes";
import authenticationRoutes from "@/resources/v1/authentication/authentication.routes";

const router = Router();
router.use("/users", userRoutes);
router.use("/auth", authenticationRoutes);

export default router;
