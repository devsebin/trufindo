import { tableName } from "@/utils/definitions/constants/table-names";
import mongoose, { Schema } from "mongoose";
import { IDeclaimerInput, IOtp } from "./otp-db-interface";

const DeclaimerSchema = new Schema<IDeclaimerInput>(
  {
    declaimer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: tableName.Declaimers,
      required: true,
    },
    accepted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const OtpSchema: Schema = new Schema<IOtp>(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    country_code: {
      type: String,
      required: true,
      trim: true,
    },

    device_id: {
      type: String,
      required: true,
      trim: true,
    },

    otp_hash: {
      type: String,
      required: true,
    },

    otp_type: {
      type: String,
      required: true,
      enum: ["login", "register"],
    },

    user_type: {
      type: String,
      required: true,
      enum: ["user", "admin", "employee"],
    },

    expires_at: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    is_used: {
      type: Boolean,
      default: false,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    last_seen_at: {
      type: Date,
      default: Date.now,
    },

    declaimers: {
      type: [DeclaimerSchema],
      default: [],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * =========================
 * TTL INDEX
 * =========================
 * Automatically deletes expired OTPs
 */
OtpSchema.index(
  { expires_at: 1 },
  {
    expireAfterSeconds: 0,
    name: "ttl_expired_otp",
  },
);

/**
 * =========================
 * MAIN OTP VALIDATION INDEX
 * =========================
 * Fast lookup during OTP verify
 */
OtpSchema.index(
  {
    phoneNumber: 1,
    country_code: 1,
    device_id: 1,
    otp_type: 1,
    is_active: 1,
    is_used: 1,
    expires_at: 1,
  },
  {
    name: "verify_otp_index",
  },
);

/**
 * =========================
 * PREVENT MULTIPLE ACTIVE OTPs
 * =========================
 * Only one active unused OTP per phone/device/type
 */
OtpSchema.index(
  {
    phoneNumber: 1,
    country_code: 1,
    device_id: 1,
    otp_type: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      is_active: true,
      is_used: false,
    },
    name: "unique_active_otp",
  },
);

/**
 * =========================
 * ADMIN / ANALYTICS INDEX
 * =========================
 */
OtpSchema.index(
  {
    createdAt: -1,
    user_type: 1,
  },
  {
    name: "admin_reporting_index",
  },
);

/**
 * =========================
 * CLEANUP / RATE LIMITING
 * =========================
 */
OtpSchema.index(
  {
    phoneNumber: 1,
    createdAt: -1,
  },
  {
    name: "rate_limit_lookup",
  },
);

const OtpModel = mongoose.model<IOtp>(tableName.Otp, OtpSchema);

export default OtpModel;
