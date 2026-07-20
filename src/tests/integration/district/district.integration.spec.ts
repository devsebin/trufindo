import mongoose from "mongoose";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";

import DistrictModel from "@/database/district/district-db-model";
import CountryModel from "@/database/country/country-db-model";
import RegionModel from "@/database/region/region-db-model";
import StatusModel from "@/database/status/status-db-model";
import "@/database/users/users-db-model";
import { connectDB, clearDB, closeDB } from "@/tests/setup/mongo-memory";

import createDistrictService from "@/resources/v1/masters/district/services/create-district.service";
import listDistrictService from "@/resources/v1/masters/district/services/list-district.service";
import showDistrictService from "@/resources/v1/masters/district/services/show-district.service";
import updateDistrictService from "@/resources/v1/masters/district/services/update-district.service";
import activateDistrictService from "@/resources/v1/masters/district/services/activate-district.service";
import deactivateDistrictService from "@/resources/v1/masters/district/services/deactivate-district.service";
import deleteDistrictService from "@/resources/v1/masters/district/services/delete-district.service";

import {
  IInputDistrictPayloadStrict,
  IUpdateDistrictPayloadStrict,
} from "@/resources/v1/masters/district/payloads/create-district.payload";

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

const createMockRegion = async (countryId: mongoose.Types.ObjectId) => {
  return await RegionModel.create({
    name: "California",
    code: "CA",
    country_id: countryId,
    is_active: true,
    is_deleted: false,
  });
};

const buildCreatePayload = (
  overrides: Partial<IInputDistrictPayloadStrict> = {},
): IInputDistrictPayloadStrict => {
  return {
    name: overrides.name ?? "Sample District",
    code: overrides.code ?? "SD",
    country_id: overrides.country_id,
    region_id: overrides.region_id,
    ...(overrides as any),
  } as IInputDistrictPayloadStrict;
};

const buildUpdatePayload = (
  overrides: Partial<IUpdateDistrictPayloadStrict> = {},
): IUpdateDistrictPayloadStrict => {
  return {
    name: overrides.name ?? "Updated District",
    code: overrides.code ?? "UD",
    country_id: overrides.country_id,
    region_id: overrides.region_id,
    ...(overrides as any),
  } as IUpdateDistrictPayloadStrict;
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

describe("Master Districts (Integration - Service)", () => {
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

  it("create-district: should create a district successfully", async () => {
    const country = await createMockCountry();
    const region = await createMockRegion(country._id);
    const payload = buildCreatePayload({ country_id: country._id, region_id: region._id });

    const req = {
      body: payload,
      originalUrl: "/v1/masters/districts",
      method: "POST",
      query: {},
      user: { role: "admin", id: makeUserId() },
    } as any;

    const result: any = await createDistrictService.execute(req, payload);
    expectSuccess(result, 201);

    const created = await DistrictModel.findOne({ name: "Sample District" });
    expect(created).not.toBeNull();
    expect(created?.code).toBe("SD");
    expect(created?.country_id?.toString()).toBe(country._id.toString());
    expect(created?.region_id?.toString()).toBe(region._id.toString());
  });

  it("create-district: should fail if district already exists (same name or code)", async () => {
    const country = await createMockCountry();
    const region = await createMockRegion(country._id);
    await DistrictModel.create({
      name: "Sample District",
      code: "SD",
      country_id: country._id,
      region_id: region._id,
      is_active: true,
      is_deleted: false,
    });

    const payload = buildCreatePayload({
      name: "Sample District",
      code: "SD",
      country_id: country._id,
      region_id: region._id,
    });
    const req = {
      body: payload,
      originalUrl: "/v1/masters/districts",
      method: "POST",
      query: {},
      user: { role: "admin", id: makeUserId() },
    } as any;

    const result: any = await createDistrictService.execute(req, payload);
    expectFailure(result, 409);
  });

  it("create-district: should fail if country does not exist", async () => {
    const country = await createMockCountry();
    const region = await createMockRegion(country._id);
    const payload = buildCreatePayload({
      country_id: new mongoose.Types.ObjectId(),
      region_id: region._id,
    });
    const req = {
      body: payload,
      originalUrl: "/v1/masters/districts",
      method: "POST",
      query: {},
      user: { role: "admin", id: makeUserId() },
    } as any;

    const result: any = await createDistrictService.execute(req, payload);
    expectFailure(result, 404);
  });

  it("create-district: should fail if region does not exist", async () => {
    const country = await createMockCountry();
    const payload = buildCreatePayload({
      country_id: country._id,
      region_id: new mongoose.Types.ObjectId(),
    });
    const req = {
      body: payload,
      originalUrl: "/v1/masters/districts",
      method: "POST",
      query: {},
      user: { role: "admin", id: makeUserId() },
    } as any;

    const result: any = await createDistrictService.execute(req, payload);
    expectFailure(result, 404);
  });

  it("list-district: should retrieve districts with pagination", async () => {
    const country = await createMockCountry();
    const region = await createMockRegion(country._id);
    await DistrictModel.create({
      name: "District One",
      code: "D1",
      country_id: country._id,
      region_id: region._id,
      is_active: true,
      is_deleted: false,
    });

    await DistrictModel.create({
      name: "District Two",
      code: "D2",
      country_id: country._id,
      region_id: region._id,
      is_active: true,
      is_deleted: false,
    });

    const req = {
      originalUrl: "/v1/masters/districts",
      method: "GET",
      query: {
        page: "1",
        limit: "1",
        order_by: "createdAt",
        order_direction: "desc",
      },
      user: { role: "admin", id: makeUserId() },
    } as any;

    const result: any = await listDistrictService.execute(req);
    expectSuccess(result, 200);

    const rows = result.result.data?.[0]?.result?.rows;
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);

    const totalCount = result.result.data?.[0]?.result?.totalCount;
    expect(totalCount).toBe(2);
  });

  it("show-district: should fetch by id and return 404 if not found", async () => {
    const country = await createMockCountry();
    const region = await createMockRegion(country._id);
    const district = await DistrictModel.create({
      name: "District Show",
      code: "DS",
      country_id: country._id,
      region_id: region._id,
      is_active: true,
      is_deleted: false,
    });

    const okResult: any = await showDistrictService.execute(district._id);
    expectSuccess(okResult, 200);

    const showDetails = okResult.result.data?.[0]?.result;
    expect(showDetails?.name).toBe("District Show");

    const notFoundResult: any = await showDistrictService.execute(
      new mongoose.Types.ObjectId(),
    );
    expectFailure(notFoundResult, 404);
  });

  it("update-district: should update fields, and fail when no changes, conflicting duplicates, or invalid references", async () => {
    const country = await createMockCountry();
    const region = await createMockRegion(country._id);
    const existingDistrict = await DistrictModel.create({
      name: "District Old",
      code: "DO",
      country_id: country._id,
      region_id: region._id,
      is_active: true,
      is_deleted: false,
    });

    const otherDistrict = await DistrictModel.create({
      name: "District Other",
      code: "DT",
      country_id: country._id,
      region_id: region._id,
      is_active: true,
      is_deleted: false,
    });

    // Successful update
    const payload = buildUpdatePayload({
      name: "District New",
      code: "DN",
      country_id: country._id,
      region_id: region._id,
    });
    const req = { body: payload } as any;

    const okResult: any = await updateDistrictService.execute(
      existingDistrict._id,
      req,
      payload,
    );
    expectSuccess(okResult, 200);

    const updated = await DistrictModel.findById(existingDistrict._id);
    expect(updated?.name).toBe("District New");
    expect(updated?.code).toBe("DN");

    // Fail because of no change detected
    const samePayload = buildUpdatePayload({
      name: "District New",
      code: "DN",
      country_id: country._id,
      region_id: region._id,
    });
    const sameReq = { body: samePayload } as any;

    const noChangeResult: any = await updateDistrictService.execute(
      existingDistrict._id,
      sameReq,
      samePayload,
    );
    expectFailure(noChangeResult, 400);

    // Fail because of conflict duplicate with existing other district
    const duplicatePayload = buildUpdatePayload({
      name: "District Other",
      code: "DT",
      country_id: country._id,
      region_id: region._id,
    });
    const duplicateReq = { body: duplicatePayload } as any;

    const duplicateResult: any = await updateDistrictService.execute(
      existingDistrict._id,
      duplicateReq,
      duplicatePayload,
    );
    expectFailure(duplicateResult, 409);

    // Fail because of invalid country id
    const invalidCountryPayload = buildUpdatePayload({
      name: "District Valid",
      code: "DV",
      country_id: new mongoose.Types.ObjectId() as any,
      region_id: region._id,
    });
    const invalidCountryReq = { body: invalidCountryPayload } as any;

    const invalidCountryResult: any = await updateDistrictService.execute(
      existingDistrict._id,
      invalidCountryReq,
      invalidCountryPayload,
    );
    expectFailure(invalidCountryResult, 404);

    // Fail because of invalid region id
    const invalidRegionPayload = buildUpdatePayload({
      name: "District Valid",
      code: "DV",
      country_id: country._id,
      region_id: new mongoose.Types.ObjectId() as any,
    });
    const invalidRegionReq = { body: invalidRegionPayload } as any;

    const invalidRegionResult: any = await updateDistrictService.execute(
      existingDistrict._id,
      invalidRegionReq,
      invalidRegionPayload,
    );
    expectFailure(invalidRegionResult, 404);
  });

  it("activate/deactivate-district: should toggle active state and reject invalid transitions", async () => {
    const country = await createMockCountry();
    const region = await createMockRegion(country._id);
    const userId = makeUserId();
    const district = await DistrictModel.create({
      name: "Toggle District",
      code: "TD",
      country_id: country._id,
      region_id: region._id,
      is_active: false,
      is_deleted: false,
    });

    // Should activate successfully
    const activated: any = await activateDistrictService.execute(
      district._id,
      userId,
    );
    expectSuccess(activated, 200);

    // Activating again should fail
    const alreadyActive: any = await activateDistrictService.execute(
      district._id,
      userId,
    );
    expectFailure(alreadyActive, 400);

    const activeDoc = await DistrictModel.findById(district._id);
    expect(activeDoc?.is_active).toBe(true);

    // Should deactivate successfully
    const deactivated: any = await deactivateDistrictService.execute(
      district._id,
      userId,
    );
    expectSuccess(deactivated, 200);

    // Deactivating again should fail
    const alreadyInactive: any = await deactivateDistrictService.execute(
      district._id,
      userId,
    );
    expectFailure(alreadyInactive, 400);
  });

  it("delete-district: should soft delete district, respecting confirmation and already deleted conditions", async () => {
    const country = await createMockCountry();
    const region = await createMockRegion(country._id);
    const userId = makeUserId();
    const activeDistrict = await DistrictModel.create({
      name: "To Delete",
      code: "TDE",
      country_id: country._id,
      region_id: region._id,
      is_active: true,
      is_deleted: false,
    });

    // Delete without force on active district should fail
    const confirmRequired: any = await deleteDistrictService.execute(
      activeDistrict._id,
      userId,
      false,
    );
    expectFailure(confirmRequired, 400);

    // Delete with force on active district should succeed
    const softDeleted: any = await deleteDistrictService.execute(
      activeDistrict._id,
      userId,
      true,
    );
    expectSuccess(softDeleted, 200);

    // Deleting already deleted district should fail
    const alreadyDeleted: any = await deleteDistrictService.execute(
      activeDistrict._id,
      userId,
      true,
    );
    expectFailure(alreadyDeleted, 400);

    const finalDoc = await DistrictModel.findOne({
      _id: activeDistrict._id,
      is_deleted: { $in: [true, false] },
    });
    expect(finalDoc?.is_deleted).toBe(true);
    expect(finalDoc?.is_active).toBe(false);
    expect(finalDoc?.deleted_by?.toString()).toBe(userId.toString());
  });
});
