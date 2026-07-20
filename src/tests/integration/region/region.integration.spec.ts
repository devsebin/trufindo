import mongoose from "mongoose";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";

import RegionModel from "@/database/region/region-db-model";
import CountryModel from "@/database/country/country-db-model";
import StatusModel from "@/database/status/status-db-model";
import "@/database/users/users-db-model";
import { connectDB, clearDB, closeDB } from "@/tests/setup/mongo-memory";

import createRegionService from "@/resources/v1/masters/region/services/create-region.service";
import listRegionService from "@/resources/v1/masters/region/services/list-region.service";
import showRegionService from "@/resources/v1/masters/region/services/show-region.service";
import updateRegionService from "@/resources/v1/masters/region/services/update-region.service";
import activateRegionService from "@/resources/v1/masters/region/services/activate-region.service";
import deactivateRegionService from "@/resources/v1/masters/region/services/deactivate-region.service";
import deleteRegionService from "@/resources/v1/masters/region/services/delete-region.service";

import {
  IInputRegionPayloadStrict,
  IUpdateRegionPayloadStrict,
} from "@/resources/v1/masters/region/payloads/create-region.payload";

const makeUserId = () => new mongoose.Types.ObjectId();

const createMockCountry = async () => {
  return await CountryModel.create({
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
};

const buildCreatePayload = (
  overrides: Partial<IInputRegionPayloadStrict> = {},
): IInputRegionPayloadStrict => {
  return {
    name: overrides.name ?? "Sample Region",
    code: overrides.code ?? "SR",
    country_id: overrides.country_id,
    ...(overrides as any),
  } as IInputRegionPayloadStrict;
};

const buildUpdatePayload = (
  overrides: Partial<IUpdateRegionPayloadStrict> = {},
): IUpdateRegionPayloadStrict => {
  return {
    name: overrides.name ?? "Updated Region",
    code: overrides.code ?? "UR",
    country_id: overrides.country_id,
    ...(overrides as any),
  } as IUpdateRegionPayloadStrict;
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

describe("Master Regions (Integration - Service)", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  });

  beforeEach(async () => {
    await clearDB();
    await StatusModel.create({
      title: "Active",
      label: "active",
      color: "#00AAFF",
      is_default: true,
      is_active: true,
      is_deleted: false,
      created_by: makeUserId(),
    });
  });

  afterAll(async () => {
    await closeDB();
  });

  it("create-region: should create a region successfully", async () => {
    const country = await createMockCountry();
    const payload = buildCreatePayload({ country_id: country._id });

    const req = {
      body: payload,
      originalUrl: "/v1/masters/regions",
      method: "POST",
      query: {},
      user: { role: "admin", id: makeUserId() },
    } as any;

    const result: any = await createRegionService.execute(req, payload);
    expectSuccess(result, 201);

    const created = await RegionModel.findOne({ name: "Sample Region" });
    expect(created).not.toBeNull();
    expect(created?.code).toBe("SR");
    expect(created?.country_id?.toString()).toBe(country._id.toString());
  });

  it("create-region: should fail if region already exists (same name or code)", async () => {
    const country = await createMockCountry();
    await RegionModel.create({
      name: "Sample Region",
      code: "SR",
      country_id: country._id,
      is_active: true,
      is_deleted: false,
    });

    const payload = buildCreatePayload({ name: "Sample Region", code: "SR", country_id: country._id });
    const req = {
      body: payload,
      originalUrl: "/v1/masters/regions",
      method: "POST",
      query: {},
      user: { role: "admin", id: makeUserId() },
    } as any;

    const result: any = await createRegionService.execute(req, payload);
    expectFailure(result, 409);
  });

  it("create-region: should fail if country does not exist", async () => {
    const payload = buildCreatePayload({ country_id: new mongoose.Types.ObjectId() });
    const req = {
      body: payload,
      originalUrl: "/v1/masters/regions",
      method: "POST",
      query: {},
      user: { role: "admin", id: makeUserId() },
    } as any;

    const result: any = await createRegionService.execute(req, payload);
    expectFailure(result, 404);
  });

  it("list-region: should retrieve regions with pagination", async () => {
    const country = await createMockCountry();
    await RegionModel.create({
      name: "Region One",
      code: "R1",
      country_id: country._id,
      is_active: true,
      is_deleted: false,
    });

    await RegionModel.create({
      name: "Region Two",
      code: "R2",
      country_id: country._id,
      is_active: true,
      is_deleted: false,
    });

    const req = {
      originalUrl: "/v1/masters/regions",
      method: "GET",
      query: {
        page: "1",
        limit: "1",
        order_by: "createdAt",
        order_direction: "desc",
      },
      user: { role: "admin", id: makeUserId() },
    } as any;

    const result: any = await listRegionService.execute(req);
    expectSuccess(result, 200);

    const rows = result.result.data?.[0]?.result?.rows;
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);

    const totalCount = result.result.data?.[0]?.result?.totalCount;
    expect(totalCount).toBe(2);
  });

  it("show-region: should fetch by id and return 404 if not found", async () => {
    const country = await createMockCountry();
    const region = await RegionModel.create({
      name: "Region Show",
      code: "RS",
      country_id: country._id,
      is_active: true,
      is_deleted: false,
    });

    const okResult: any = await showRegionService.execute(region._id);
    expectSuccess(okResult, 200);

    const showDetails = okResult.result.data?.[0]?.result;
    expect(showDetails?.name).toBe("Region Show");

    const notFoundResult: any = await showRegionService.execute(
      new mongoose.Types.ObjectId(),
    );
    expectFailure(notFoundResult, 404);
  });

  it("update-region: should update fields, and fail when no changes, conflicting duplicates, or invalid country", async () => {
    const country = await createMockCountry();
    const existingRegion = await RegionModel.create({
      name: "Region Old",
      code: "RO",
      country_id: country._id,
      is_active: true,
      is_deleted: false,
    });

    const otherRegion = await RegionModel.create({
      name: "Region Other",
      code: "RT",
      country_id: country._id,
      is_active: true,
      is_deleted: false,
    });

    // Successful update
    const payload = buildUpdatePayload({ name: "Region New", code: "RN", country_id: country._id });
    const req = { body: payload } as any;

    const okResult: any = await updateRegionService.execute(
      existingRegion._id,
      req,
      payload,
    );
    expectSuccess(okResult, 200);

    const updated = await RegionModel.findById(existingRegion._id);
    expect(updated?.name).toBe("Region New");
    expect(updated?.code).toBe("RN");

    // Fail because of no change detected
    const samePayload = buildUpdatePayload({ name: "Region New", code: "RN", country_id: country._id });
    const sameReq = { body: samePayload } as any;

    const noChangeResult: any = await updateRegionService.execute(
      existingRegion._id,
      sameReq,
      samePayload,
    );
    expectFailure(noChangeResult, 400);

    // Fail because of conflict duplicate with existing other region
    const duplicatePayload = buildUpdatePayload({ name: "Region Other", code: "RT", country_id: country._id });
    const duplicateReq = { body: duplicatePayload } as any;

    const duplicateResult: any = await updateRegionService.execute(
      existingRegion._id,
      duplicateReq,
      duplicatePayload,
    );
    expectFailure(duplicateResult, 409);

    // Fail because of invalid country id
    const invalidCountryPayload = buildUpdatePayload({
      name: "Region Valid",
      code: "RV",
      country_id: new mongoose.Types.ObjectId() as any,
    });
    const invalidCountryReq = { body: invalidCountryPayload } as any;

    const invalidCountryResult: any = await updateRegionService.execute(
      existingRegion._id,
      invalidCountryReq,
      invalidCountryPayload,
    );
    expectFailure(invalidCountryResult, 404);
  });

  it("activate/deactivate-region: should toggle active state and reject invalid transitions", async () => {
    const country = await createMockCountry();
    const userId = makeUserId();
    const region = await RegionModel.create({
      name: "Toggle Region",
      code: "TR",
      country_id: country._id,
      is_active: false,
      is_deleted: false,
    });

    // Should activate successfully
    const activated: any = await activateRegionService.execute(
      region._id,
      userId,
    );
    expectSuccess(activated, 200);

    // Activating again should fail
    const alreadyActive: any = await activateRegionService.execute(
      region._id,
      userId,
    );
    expectFailure(alreadyActive, 400);

    const activeDoc = await RegionModel.findById(region._id);
    expect(activeDoc?.is_active).toBe(true);

    // Should deactivate successfully
    const deactivated: any = await deactivateRegionService.execute(
      region._id,
      userId,
    );
    expectSuccess(deactivated, 200);

    // Deactivating again should fail
    const alreadyInactive: any = await deactivateRegionService.execute(
      region._id,
      userId,
    );
    expectFailure(alreadyInactive, 400);
  });

  it("delete-region: should soft delete region, respecting confirmation and already deleted conditions", async () => {
    const country = await createMockCountry();
    const userId = makeUserId();
    const activeRegion = await RegionModel.create({
      name: "To Delete",
      code: "TDE",
      country_id: country._id,
      is_active: true,
      is_deleted: false,
    });

    // Delete without force on active region should fail
    const confirmRequired: any = await deleteRegionService.execute(
      activeRegion._id,
      userId,
      false,
    );
    expectFailure(confirmRequired, 400);

    // Delete with force on active region should succeed
    const softDeleted: any = await deleteRegionService.execute(
      activeRegion._id,
      userId,
      true,
    );
    expectSuccess(softDeleted, 200);

    // Deleting already deleted region should fail
    const alreadyDeleted: any = await deleteRegionService.execute(
      activeRegion._id,
      userId,
      true,
    );
    expectFailure(alreadyDeleted, 400);

    const finalDoc = await RegionModel.findOne({
      _id: activeRegion._id,
      is_deleted: { $in: [true, false] },
    });
    expect(finalDoc?.is_deleted).toBe(true);
    expect(finalDoc?.is_active).toBe(false);
    expect(finalDoc?.deleted_by?.toString()).toBe(userId.toString());
  });
});
