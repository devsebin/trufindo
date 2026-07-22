import authenticate from "@/middlewares/authentication-validation.middleware";
import express from "express";
import { Store, List } from "./authentication-session.controller";
import { authorization } from "@/middlewares/authorization-validation.middleware";
const router = express.Router();

router.post("/authentication-sessions", authenticate, Store);
router.get("/", authenticate, authorization, List);

export default router;
