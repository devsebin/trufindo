import mongoose from "mongoose";

import StatusModel from "@/database/status/status-db-model";
// Register dependency models referenced by Status (e.g. created_by/updated_by refs)
import "@/database/users/users-db-model";
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

// --- Helpers

type MockReq = Partial<
  Record<string, never> & {
    query?: any;
    params?: any;
    body?: any;
  }
> & {
  query?: any;
  params?: any;
  body?: any;
};

const makeUserId = () => new mongoose.Types.ObjectId();

const buildCreatePayload = (
  overrides: Partial<IInputStatusPayloadStrict> = {},
) => {
  const title = overrides.title ?? "On Hold";
  const base = {
    title,
    color: overrides.color ?? "#FFA500",
  } as any;
  return { ...base, ...overrides } as IInputStatusPayloadStrict;
};

const buildUpdatePayload = (
  overrides: Partial<IUpdateStatusPayloadStrict> = {},
) => {
  const title = overrides.title ?? "Active";
  const base = {
    title,
    color: overrides.color ?? "#00AAFF",
    label: overrides.label ?? "active",
  } as any;
  return { ...base, ...overrides } as IUpdateStatusPayloadStrict;
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

// --- DB lifecycle

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await clearDB();
});

afterAll(async () => {
  // Ensure cleanup has enough time; MongoMemoryReplSet shutdown can be slow.
  await closeDB();
});

describe("Master Statuses (Integration)", () => {
  describe("create-status", () => {
    it("should create a status", async () => {
      const createdBy = makeUserId();

      const payload = buildCreatePayload({
        title: "On hold",
        label: "on_hold",
        color: "#FFA500",
      });

      // created_by is required by StatusSchema
      (payload as any).created_by = createdBy;

      const req = {
        body: payload,
        originalUrl: "/v1/masters/status",
        method: "POST",
        query: {},
        user: {
          role: "admin",
          id: makeUserId(),
        },
      } as any;

      const result: any = await createStatusService.execute(
        req as any,
        payload,
      );

      expect(result).toBeDefined();
      if (result?.result?.success !== true) {
        // eslint-disable-next-line no-console
        console.log(
          "createStatusService.execute result:",
          JSON.stringify(result),
        );
      }
      expectSuccess(result, 201);

      const created = await StatusModel.findOne({
        label: "on_hold",
      });
      expect(created).not.toBeNull();

      // default setter should ensure at least one active default exists
      const defaults = await StatusModel.find({
        is_default: true,
        is_active: true,
        is_deleted: false,
      });
      expect(defaults.length).toBe(1);
    });

    it("should fail if status already exists (same label, active)", async () => {
      await StatusModel.create({
        title: "On hold",
        label: "on_hold",
        color: "#FFA500",
        is_default: true,
        is_active: true,
        is_deleted: false,
        created_by: makeUserId(),
      });

      const req = {} as any;
      const result: any = await createStatusService.execute(
        req,
        buildCreatePayload({ label: "on_hold", title: "On hold" }),
      );

      expectFailure(result, 409);
    });
  });

  describe("list-status", () => {
    it("should list statuses with pagination and rows", async () => {
      const createdBy = makeUserId();

      await StatusModel.create({
        title: "Default",
        label: "default",
        color: "#111111",
        is_default: true,
        is_active: true,
        is_deleted: false,
        created_by: createdBy,
      });

      await StatusModel.create({
        title: "Second",
        label: "second",
        color: "#222222",
        is_default: false,
        is_active: true,
        is_deleted: false,
        created_by: createdBy,
      });

      const req = {
        originalUrl: "/v1/masters/status",
        method: "GET",
        query: {
          page: "1",
          limit: "1",
          order_by: "createdAt",
          order_direction: "desc",
        },
        user: {
          role: "admin",
          id: createdBy,
        },
      };

      const result: any = await listStatusService.execute(req as any);
      expect(result).toBeDefined();
      expectSuccess(result, 200);

      const rows = result.result.data?.[0]?.result?.rows;
      // data is wrapped by successResponse; statusPayload uses result as successResponse
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(1);

      const totalCount = result.result.data?.[0]?.result?.totalCount;
      expect(totalCount).toBe(2);
    });
  });

  describe("show-status", () => {
    it("should fetch by id", async () => {
      const createdBy = makeUserId();
      const doc = await StatusModel.create({
        title: "Active",
        label: "active",
        color: "#00AAFF",
        is_default: false,
        is_active: true,
        is_deleted: false,
        created_by: createdBy,
      });

      const result: any = await showStatusService.execute(doc._id);
      expectSuccess(result, 200);

      const status = result.result.data?.[0]?.result;
      expect(status).toBeDefined();
      expect(status.label).toBe("active");
      expect(status.is_active).toBe(true);
    });

    it("should fail if status not found", async () => {
      const result: any = await showStatusService.execute(
        new mongoose.Types.ObjectId(),
      );
      expectFailure(result, 404);
    });
  });

  describe("update-status", () => {
    it("should update fields", async () => {
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

      const req = { body: buildUpdatePayload() } as any;

      const result: any = await updateStatusesService.execute(
        doc._id,
        req,
        buildUpdatePayload({
          title: "New title",
          label: "new_title",
          color: "#BBBBBB",
        }) as any,
      );

      expectSuccess(result, 200);

      const updated = await StatusModel.findById(doc._id);
      expect(updated).not.toBeNull();
      expect(updated?.title).toBe("New title");
      expect(updated?.label).toBe("new_title");
      expect(updated?.color).toBe("#BBBBBB");
    });

    it("should fail when no change detected", async () => {
      const owner = makeUserId();
      const doc = await StatusModel.create({
        title: "Old",
        label: "old",
        color: "#AAAAAA",
        is_default: false,
        is_active: true,
        is_deleted: false,
        created_by: owner,
      });

      const payload = {
        title: doc.title,
        label: doc.label,
        color: doc.color,
      } as any;

      const req = { body: payload } as any;

      const result: any = await updateStatusesService.execute(
        doc._id,
        req,
        payload,
      );
      expectFailure(result, 400);
    });
  });

  describe("activate-status", () => {
    it("should activate an inactive status", async () => {
      const owner = makeUserId();
      const userId = makeUserId();

      const doc = await StatusModel.create({
        title: "Inactive",
        label: "inactive",
        color: "#CCCCCC",
        is_default: false,
        is_active: false,
        is_deleted: false,
        created_by: owner,
        updated_by: owner,
      });

      const result: any = await activateStatusService.execute(doc._id, userId);
      expectSuccess(result, 200);

      const updated = await StatusModel.findById(doc._id);
      expect(updated?.is_active).toBe(true);
      expect(updated?.is_deleted).toBe(false);
    });

    it("should fail if already active", async () => {
      const owner = makeUserId();
      const userId = makeUserId();

      const doc = await StatusModel.create({
        title: "Active",
        label: "active",
        color: "#00AAFF",
        is_default: false,
        is_active: true,
        is_deleted: false,
        created_by: owner,
      });

      const result: any = await activateStatusService.execute(doc._id, userId);
      expectFailure(result, 400);
    });
  });

  describe("deactivate-status", () => {
    it("should deactivate an active status", async () => {
      const owner = makeUserId();
      const userId = makeUserId();

      const doc = await StatusModel.create({
        title: "Active",
        label: "active2",
        color: "#00AAFF",
        is_default: false,
        is_active: true,
        is_deleted: false,
        created_by: owner,
      });

      const result: any = await deactivateStatusService.execute(
        doc._id,
        userId,
      );
      expectSuccess(result, 200);

      const updated = await StatusModel.findById(doc._id);
      expect(updated?.is_active).toBe(false);
    });

    it("should fail if already inactive", async () => {
      const owner = makeUserId();
      const userId = makeUserId();

      const doc = await StatusModel.create({
        title: "Inactive",
        label: "inactive2",
        color: "#CCCCCC",
        is_default: false,
        is_active: false,
        is_deleted: false,
        created_by: owner,
      });

      const result: any = await deactivateStatusService.execute(
        doc._id,
        userId,
      );
      expectFailure(result, 400);
    });
  });

  describe("delete-status", () => {
    it("should fail with confirmation_required when deleting active status without force", async () => {
      const owner = makeUserId();
      const doc = await StatusModel.create({
        title: "Active",
        label: "todelete",
        color: "#00AAFF",
        is_default: false,
        is_active: true,
        is_deleted: false,
        created_by: owner,
      });

      const result: any = await deleteStatusesService.execute(
        doc._id,
        makeUserId(),
        false,
      );
      expectFailure(result, 400);
    });

    it("should delete (soft) with force", async () => {
      const owner = makeUserId();
      const userId = makeUserId();
      const doc = await StatusModel.create({
        title: "Active",
        label: "todelete2",
        color: "#00AAFF",
        is_default: false,
        is_active: true,
        is_deleted: false,
        created_by: owner,
      });

      const result: any = await deleteStatusesService.execute(
        doc._id,
        userId,
        true,
      );
      expectSuccess(result, 200);

      const updated = await StatusModel.findById(doc._id);
      expect(updated?.is_deleted).toBe(true);
      expect(updated?.is_active).toBe(false);
      expect(String(updated?.deleted_by)).toBe(String(userId));
    });

    it("should fail if already deleted", async () => {
      const owner = makeUserId();
      const userId = makeUserId();

      const doc = await StatusModel.create({
        title: "Deleted",
        label: "deleted",
        color: "#00AAFF",
        is_default: false,
        is_active: false,
        is_deleted: true,
        created_by: owner,
        deleted_by: owner,
      });

      const result: any = await deleteStatusesService.execute(
        doc._id,
        userId,
        true,
      );
      expectFailure(result, 400);
    });
  });

  describe("load-bearing / uniqueness: default status", () => {
    it("should ensure unique active default (partial unique index) when creating multiple statuses", async () => {
      const req = {} as any;

      // first create makes it default
      await createStatusService.execute(
        req,
        buildCreatePayload({
          title: "Status A",
          label: "status_a",
          color: "#111111",
        }),
      );

      // second create should not create another active default due to helper logic
      await createStatusService.execute(
        req,
        buildCreatePayload({
          title: "Status B",
          label: "status_b",
          color: "#222222",
        }),
      );

      const defaults = await StatusModel.find({
        is_default: true,
        is_active: true,
        is_deleted: false,
      });

      expect(defaults.length).toBe(1);
    });
  });
});
