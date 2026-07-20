import express from "express";
import request from "supertest";
import mongoose from "mongoose";

import StatusModel from "@/database/status/status-db-model";
import "@/database/users/users-db-model";
import { connectDB, clearDB, closeDB } from "@/tests/setup/mongo-memory";

import statusRouter from "@/resources/v1/masters/status/status.routes";

jest.mock(
  "@/resources/v1/activity-log/services/create-activity-log.service",
  () => ({
    __esModule: true,
    default: {
      execute: jest.fn(() => undefined),
    },
  }),
);

describe("Master Statuses (Integration - Controller)", () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  const app = express();
  app.use(express.json());
  app.use("/masters/status", statusRouter);

  it("POST /masters/status creates a status", async () => {
    const res = await request(app).post("/masters/status").send({
      title: "On hold",
      color: "#FFA500",
    });

    // Controller should respond with Created
    if (res.status !== 201) {
      // eslint-disable-next-line no-console
      console.log("POST /masters/status failed:", res.status, res.body);
    }

    expect(res.status).toBe(201);

    const created = await StatusModel.findOne({ label: "on_hold" });
    expect(created).not.toBeNull();
  });
});
