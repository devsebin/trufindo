import { Types } from "mongoose";

export interface IDeclaimerInput {
  declaimer_id: Types.ObjectId; // allow string from API, cast later
  accepted: boolean;
}

export interface IVerifyOtpInput {
  otp: string; // exactly 6 chars (validation handles length)
  type: "login" | "register";
  declaimers: IDeclaimerInput[];
}
