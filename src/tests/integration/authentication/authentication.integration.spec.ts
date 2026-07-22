import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { describe, it, expect, beforeAll, beforeEach, afterAll, jest } from "@jest/globals";

import OtpModel from "@/database/otp/otp-db-model";
import User from "@/database/users/users-db-model";
import CountryModel from "@/database/country/country-db-model";
import { DeclaimerModel } from "@/database/declaimers/declaimer-db-model";
import RefreshSessionModel from "@/database/auth-sessions/auth-session-db-model";
import StatusModel from "@/database/status/status-db-model";
import PriorityModel from "@/database/priority/priority-db-model";

import { connectDB, clearDB, closeDB } from "@/tests/setup/mongo-memory";
import authenticationRouter from "@/resources/v1/authentication/authentication.routes";

// Mock the activity log service to avoid DB dependencies during tests
jest.mock(
  "@/resources/v1/activity-log/services/create-activity-log.service",
  () => ({
    __esModule: true,
    default: {
      execute: jest.fn(() => undefined),
    },
  }),
);

describe("Authentication (Integration)", () => {
  let app: express.Application;
  let countryDoc: any;
  let declaimerDoc: any;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    app = express();
    app.use(express.json());
    // Attach dummy geo middleware if needed or mock geoData on request
    app.use((req: any, res, next) => {
      req.geoData = {
        city: "San Francisco",
        country: "US",
        region: "CA",
        query: "127.0.0.1",
      };
      next();
    });
    app.use("/auth", authenticationRouter);
  });

  beforeEach(async () => {
    await clearDB();

    // Create a mock status (required by defaultStatus.plugin.ts on User creation)
    await StatusModel.create({
      title: "Active",
      label: "active",
      color: "#00AAFF",
      is_default: true,
      is_active: true,
      is_deleted: false,
    });

    // Create a mock priority (required by defaultPriority.plugin.ts on User creation)
    await PriorityModel.create({
      title: "High",
      label: "high",
      color: "#FF0000",
      is_default: true,
      is_active: true,
      is_deleted: false,
    });

    // Create a mock country
    countryDoc = await CountryModel.create({
      name: "United States",
      iso_code: "US",
      iso_code_3: "USA",
      code: "us",
      phone_code: "+1",
      currency: "USD",
      continent: "North America",
      is_active: true,
      is_deleted: false,
    });

    // Create a mock declaimer
    declaimerDoc = await DeclaimerModel.create({
      key: "terms_conditions",
      title: "Terms and Conditions",
      content: "Sample terms content",
      version: 1,
      is_active: true,
      is_deleted: false,
      created_by: new mongoose.Types.ObjectId(),
    });
  });

  afterAll(async () => {
    await closeDB();
  });

  describe("POST /auth/sent-otp", () => {
    it("should successfully send an OTP for registration of a normal user", async () => {
      const res = await request(app)
        .post("/auth/sent-otp")
        .send({
          phone: "2025550199",
          country: "US",
          type: "register",
          device_id: "test-device",
          user_type: "user",
          declaimers: [
            {
              declaimer_id: declaimerDoc._id.toString(),
              accepted: true,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const resultData = res.body.data[0].result;
      expect(resultData.id).toBeDefined();

      const otpInDb = await OtpModel.findById(resultData.id);
      expect(otpInDb).not.toBeNull();
      expect(otpInDb?.phoneNumber).toBe("+12025550199");
    });

    it("should reject registration with admin or employee role via OTP signup", async () => {
      const res = await request(app)
        .post("/auth/sent-otp")
        .send({
          phone: "2025550199",
          country: "US",
          type: "register",
          device_id: "test-device",
          user_type: "admin",
          declaimers: [
            {
              declaimer_id: declaimerDoc._id.toString(),
              accepted: true,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should trigger cooldown when requesting OTP twice in 30 seconds", async () => {
      const payload = {
        phone: "2025550199",
        country: "US",
        type: "register",
        device_id: "test-device",
        user_type: "user",
        declaimers: [
          {
            declaimer_id: declaimerDoc._id.toString(),
            accepted: true,
          },
        ],
      };

      await request(app).post("/auth/sent-otp").send(payload);
      const res = await request(app).post("/auth/sent-otp").send(payload);

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("OTP was recently sent");
    });
  });

  describe("POST /auth/verify-otp/:id", () => {
    it("should successfully verify OTP and register a user", async () => {
      // 1. Send OTP first (we'll manually query the generated OTP hash/plain OTP)
      // Since generateOTP creates a random code, let's mock it or fetch the generated code from DB log
      // In sent-otp service, we do: console.log(otp)
      // Let's create the OTP doc directly in the DB for verification test to make it reliable
      const bcrypt = require("bcrypt");
      const otpHash = await bcrypt.hash("123456", 10);

      const otpDoc = await OtpModel.create({
        phoneNumber: "+12025550199",
        country_code: "US",
        device_id: "test-device",
        otp_type: "register",
        user_type: "user",
        otp_hash: otpHash,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        last_seen_at: new Date(),
        declaimers: [
          {
            declaimer_id: declaimerDoc._id,
            accepted: true,
          },
        ],
        is_active: true,
      });

      const res = await request(app)
        .post(`/auth/verify-otp/${otpDoc._id}`)
        .send({
          otp: "123456",
        });

      if (res.status !== 200) {
        console.log("Verify OTP failure body:", JSON.stringify(res.body, null, 2));
      }
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const resultData = res.body.data[0].result;
      expect(resultData.accessToken).toBeDefined();
      expect(resultData.refreshToken).toBeDefined();

      const user = await User.findOne({ phone: "+12025550199" });
      expect(user).not.toBeNull();
      expect(user?.role).toBe("user");
      expect(user?.phoneVerified).toBe(true);
    });

    it("should prevent login if user role does not match requested user_type", async () => {
      // 1. Create a user with role 'user'
      await User.create({
        phone: "+12025550199",
        role: "user",
        is_active: true,
        phoneVerified: true,
        status: true,
      });

      // 2. Generate an OTP for login with user_type 'admin'
      const bcrypt = require("bcrypt");
      const otpHash = await bcrypt.hash("123456", 10);

      const otpDoc = await OtpModel.create({
        phoneNumber: "+12025550199",
        country_code: "US",
        device_id: "test-device",
        otp_type: "login",
        user_type: "admin", // attacker requests admin login
        otp_hash: otpHash,
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        last_seen_at: new Date(),
        is_active: true,
      });

      const res = await request(app)
        .post(`/auth/verify-otp/${otpDoc._id}`)
        .send({
          otp: "123456",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("User role mismatch");
    });
  });

  describe("POST /auth/refresh-token", () => {
    it("should successfully rotate the refresh token", async () => {
      // Create user
      const user = await User.create({
        phone: "+12025550199",
        role: "user",
        is_active: true,
        phoneVerified: true,
        status: true,
      });

      // Sign tokens
      const { generateTokens, hashToken } = require("@/utils/helpers/authentication.helper");
      const tokens = generateTokens(user);

      // Create session
      await RefreshSessionModel.create({
        userId: user._id,
        refreshTokenHash: hashToken(tokens.refreshToken),
        tokenId: tokens.token_id,
        deviceId: "test-device",
        deviceName: "Web",
        device: {
          userAgent: "Mozilla/5.0",
          browser: "Chrome",
          os: "Windows",
          deviceType: "desktop",
        },
        ipAddress: "127.0.0.1",
        location: { country: "US", city: "San Francisco" },
        isRevoked: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .post("/auth/refresh-token")
        .send({
          refresh_token: tokens.refreshToken,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const resultData = res.body.data[0].result;
      expect(resultData.accessToken).toBeDefined();
      expect(resultData.refreshToken).toBeDefined();
    });

    it("should revoke all user sessions if refresh token match fails (stolen token detection)", async () => {
      const user = await User.create({
        phone: "+12025550199",
        role: "user",
        is_active: true,
        phoneVerified: true,
        status: true,
      });

      const { generateTokens, hashToken } = require("@/utils/helpers/authentication.helper");
      const tokens = generateTokens(user);

      // Create active session
      await RefreshSessionModel.create({
        userId: user._id,
        refreshTokenHash: hashToken("different-refresh-token"), // Mismatch
        tokenId: tokens.token_id,
        deviceId: "test-device",
        deviceName: "Web",
        device: { userAgent: "Mozilla/5.0", browser: "", os: "", deviceType: "desktop" },
        ipAddress: "127.0.0.1",
        location: { country: "", city: "" },
        isRevoked: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .post("/auth/refresh-token")
        .send({
          refresh_token: tokens.refreshToken,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      // Verify session was revoked in DB
      const sessions = await RefreshSessionModel.find({ userId: user._id });
      expect(sessions.length).toBe(1);
      expect(sessions[0].isRevoked).toBe(true);
    });
  });
});
