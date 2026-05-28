import { Document, Types } from "mongoose";

export interface IDeclaimerInput {
  declaimer_id: Types.ObjectId;
  accepted: boolean;
}
export interface IOtp {
  phoneNumber: string;
  country_code: string;
  device_id: string;
  otp_type: string;
  user_type: string;
  otp_hash: string;
  expires_at: Date;
  attempts: number;
  is_used: boolean;
  is_active: boolean;
  last_seen_at: Date;
  declaimers: IDeclaimerInput[];
}

export interface IOtpDocument extends IOtp, Document {}
