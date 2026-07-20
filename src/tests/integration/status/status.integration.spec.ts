import mongoose from "mongoose";

import StatusModel from "@/database/status/status-db-model";
import { connectDB, clearDB, closeDB } from "@/tests/setup/mongo-memory";

import createStatusService from "@/resources/v1/masters/status/services/create-status.service";
import listStatusService from "@/resources/v1/masters/status/services/list-status.service";
import showStatusService from "@/resources/v1/masters/status/services/show-status.service";
import updateStatusesService from "@/resources/v1/masters/status/services/update-status.service";
import activateStatusService from "@/resources/v1/masters/status/services/activate-status.service";
import deactivateStatusService from "@/resources/v1/masters/status/services/deactivate-status.service";
import deleteStatusesService from "@/resources/v1/masters/status/services/delete-status.service";

import {
  IInputStatusPayloadStrict,
  IUpdateStatusPayloadStrict,
} from "@/resources/v1/masters/status/payloads/create-status.payload";

const makeUserId = () => new mongoose.Types.ObjectId();

const buildCreatePayload = (
  overrides: Partial<IInputStatusPayloadStrict> = {},
): IInputStatusPayloadStrict => {
  const title = overrides.title ?? "On Hold";
  return {
    title,
    color: overrides.color ?? "#FFA500",
    label: overrides.label ?? "on_hold",
    ...(overrides as any),
  } as IInputStatusPayloadStrict;
};

const buildUpdatePayload = (
  overrides: Partial<IUpdateStatusPayloadStrict> = {},
): IUpdateStatusPayloadStrict => {
  const title = overrides.title ?? "Active";
  return {
    title,
    color: overrides.color ?? "#00AAFF",
    label: overrides.label ?? "active",
    ...(overrides as any),
  } as IUpdateStatusPayloadStrict;
};

const expectSuccess = (res: any, expectedCode: number) => {
  expect(res?.result?.success).toBe(true);
  expect(res?.result?.code).toBe(expectedCode);
  expect(Array.isArray(res?.DbTransaction)).toBe(true);
};

const expectFailure = (res: any, expectedCode: number) => {
  expect(res?.result?.success).toBe(false);
  expect(res?.result?.code).toBe(expectedCode);
};

describe("Master Statuses (Integration - Service)", () => {
  beforeAll(async () => {
    // jest.setup.ts already connects; avoid double-connect issues
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  // it("create-status: should create a status + ensure unique active default", async () => {
  //   const req = {
  //     body: undefined,
  //     originalUrl: "/v1/masters/status",
  //     method: "POST",
  //     query: {},
  //     user: { role: "admin", id: new mongoose.Types.ObjectId() },
  //   } as any;

  //   await createStatusService.execute(
  //     req,
  //     buildCreatePayload({
  //       title: "On hold",
  //       label: "on_hold",
  //       color: "#FFA500",
  //     }),
  //   );

  //   const created = await StatusModel.findOne({ label: "on_hold" });
  //   expect(created).not.toBeNull();

  //   const defaults = await StatusModel.find({
  //     is_default: true,
  //     is_active: true,
  //     is_deleted: false,
  //   });
  //   expect(defaults.length).toBe(null);
  // });

  it("create-status: should fail if status already exists (same label, active)", async () => {
    await StatusModel.create({
      title: "On hold",
      label: "on_hold",
      color: "#FFA500",
      is_default: true,
      is_active: true,
      is_deleted: false,
      created_by: makeUserId(),
    });

    const result: any = await createStatusService.execute(
      {} as any,
      buildCreatePayload({ title: "On hold", label: "on_hold" }),
    );

    expectFailure(result, 409);
  });

  it("load-bearing / integration: list-status with pagination", async () => {
    await StatusModel.create({
      title: "Default",
      label: "default",
      color: "#111111",
      is_default: true,
      is_active: true,
      is_deleted: false,
      created_by: makeUserId(),
    });

    await StatusModel.create({
      title: "Second",
      label: "second",
      color: "#222222",
      is_default: false,
      is_active: true,
      is_deleted: false,
      created_by: makeUserId(),
    });

    const result: any = await listStatusService.execute({
      originalUrl: "/v1/masters/status",
      method: "GET",
      query: {
        page: "1",
        limit: "1",
        order_by: "createdAt",
        order_direction: "desc",
      },
      user: { role: "admin", id: makeUserId() },
    } as any);

    expectSuccess(result, 200);

    const rows = result.result.data?.[0]?.result?.rows;
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);

    const totalCount = result.result.data?.[0]?.result?.totalCount;
    expect(totalCount).toBe(2);
  });

  it("show-status: should fetch by id and fail if not found", async () => {
    const doc = await StatusModel.create({
      title: "Active",
      label: "active",
      color: "#00AAFF",
      is_default: false,
      is_active: true,
      is_deleted: false,
      created_by: makeUserId(),
    });

    const ok: any = await showStatusService.execute(doc._id);
    expectSuccess(ok, 200);

    const notFound: any = await showStatusService.execute(
      new mongoose.Types.ObjectId(),
    );
    expectFailure(notFound, 404);
  });

  it("update-status: should update fields, and fail when no change detected", async () => {
    const owner = makeUserId();
    const doc = await StatusModel.create({
      title: "Old",
      label: "old",
      color: "#AAAAAA",
      is_default: false,
      is_active: true,
      is_deleted: false,
      created_by: owner,
      updated_by: owner,
    });

    const ok: any = await updateStatusesService.execute(
      doc._id,
      { body: buildUpdatePayload() } as any,
      buildUpdatePayload({
        title: "New title",
        label: "new_title",
        color: "#BBBBBB",
      }),
    );

    expectSuccess(ok, 200);

    const updated = await StatusModel.findById(doc._id);
    expect(updated?.title).toBe("New title");
    expect(updated?.label).toBe("new_title");
    expect(updated?.color).toBe("#BBBBBB");

    const payload = {
      title: updated?.title,
      label: updated?.label,
      color: updated?.color,
    } as any;

    const fail: any = await updateStatusesService.execute(
      doc._id,
      { body: payload } as any,
      payload,
    );

    expectFailure(fail, 400);
  });

  it("activate/deactivate: should toggle active state and reject invalid transitions", async () => {
    const owner = makeUserId();
    const userId = makeUserId();

    const inactive = await StatusModel.create({
      title: "Inactive",
      label: "inactive",
      color: "#CCCCCC",
      is_default: false,
      is_active: false,
      is_deleted: false,
      created_by: owner,
      updated_by: owner,
    });

    const activated: any = await activateStatusService.execute(
      inactive._id,
      userId,
    );
    expectSuccess(activated, 200);

    const alreadyActive: any = await activateStatusService.execute(
      inactive._id,
      userId,
    );
    expectFailure(alreadyActive, 400);

    const activeDoc = await StatusModel.findById(inactive._id);
    expect(activeDoc?.is_active).toBe(true);

    const deactivated: any = await deactivateStatusService.execute(
      inactive._id,
      userId,
    );
    expectSuccess(deactivated, 200);

    const alreadyInactive: any = await deactivateStatusService.execute(
      inactive._id,
      userId,
    );
    expectFailure(alreadyInactive, 400);
  });

  it("delete-status: should respect confirmation + handle already-deleted", async () => {
    const owner = makeUserId();
    const userId = makeUserId();

    const active = await StatusModel.create({
      title: "Active",
      label: "todelete",
      color: "#00AAFF",
      is_default: false,
      is_active: true,
      is_deleted: false,
      created_by: owner,
    });

    const confirmRequired: any = await deleteStatusesService.execute(
      active._id,
      userId,
      false,
    );
    expectFailure(confirmRequired, 400);

    const softDeleted: any = await deleteStatusesService.execute(
      active._id,
      userId,
      true,
    );
    expectSuccess(softDeleted, 200);

    const alreadyDeleted: any = await deleteStatusesService.execute(
      active._id,
      userId,
      true,
    );
    expectFailure(alreadyDeleted, 400);

    const updated = await StatusModel.findById(active._id);
    expect(updated?.is_deleted).toBe(true);
    expect(String(updated?.deleted_by)).toBe(String(userId));
    expect(updated?.is_active).toBe(false);
  });

  // it("load-bearing / uniqueness: default status stays singular after multiple creations", async () => {
  //   const req = {} as any;

  //   await createStatusService.execute(
  //     req,
  //     buildCreatePayload({
  //       title: "Status A",
  //       label: "status_a",
  //       color: "#111111",
  //     }),
  //   );

  //   await createStatusService.execute(
  //     req,
  //     buildCreatePayload({
  //       title: "Status B",
  //       label: "status_b",
  //       color: "#222222",
  //     }),
  //   );

  //   const defaults = await StatusModel.find({
  //     is_default: true,
  //     is_active: true,
  //     is_deleted: false,
  //   });

  //   expect(defaults.length).toBe(1);
  // });
});
