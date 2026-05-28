import express from "express";
import otpController from "./otp.controller";
const router = express.Router();

router.post("/send", otpController.Send);
router.post("/verify", otpController.Verify);
router.post("/resend", otpController.Resend);

export default router;
