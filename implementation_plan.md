# Implementation Plan - Complete District Module and Add Jest Test

This plan outlines the steps required to complete the district master module and add a Jest integration test for it, matching the patterns of the existing `status` and `priority` master modules.

## User Review Required

> [!NOTE]
> The district routes will be registered at `/api/v1/masters/districts` in `src/routes/master.routes.ts`.

## Proposed Changes

---

### Master District Module

Completing the `district` module by adding the missing controller, routes, fixing a missing import in the update helper, and registering the routes.

#### [MODIFY] [update-district.helper.service.ts](file:///d:/WorkSpace/trufindo/src/resources/v1/masters/district/helpers/operations/update-district.helper.service.ts)
- Add the missing import for `DbTransaction` to resolve potential compilation/Linter issues.

#### [NEW] [district.controller.ts](file:///d:/WorkSpace/trufindo/src/resources/v1/masters/district/district.controller.ts)
- Implement `districtController` with actions for:
  - `Store` (Create)
  - `Update` (Update)
  - `Delete` (Soft delete)
  - `Show` (Get by ID)
  - `Index` (List with pagination)
  - `activate` (Enable)
  - `deactivate` (Disable)
- Log activities using `createActivityLogService`.

#### [NEW] [district.routes.ts](file:///d:/WorkSpace/trufindo/src/resources/v1/masters/district/district.routes.ts)
- Create routes mapping endpoints to the `districtController`:
  - `POST /` (Store)
  - `GET /` (Index)
  - `GET /:id` (Show)
  - `PUT /:id` (Update)
  - `DELETE /:id` (Delete)
  - `PATCH /:id/enable` (activate)
  - `PATCH /:id/disable` (deactivate)
- Apply validation middlewares: `validationMiddleware` and `paramsValidator`.

#### [MODIFY] [master.routes.ts](file:///d:/WorkSpace/trufindo/src/routes/master.routes.ts)
- Import `districtRoutes` and register them under `/districts`.

---

### Test Suite

Adding integration tests to verify the district API and service actions under MongoDB memory server.

#### [NEW] [district.integration.spec.ts](file:///d:/WorkSpace/trufindo/src/tests/integration/district/district.integration.spec.ts)
- Write integration tests for:
  - Creation of a district (including duplicate check and validation).
  - Showing/fetching district details by ID.
  - Listing districts with pagination.
  - Updating a district (checking duplicate constraints, no-change constraint).
  - Enabling/disabling state transitions.
  - Deleting a district (with/without force action).

## Verification Plan

### Automated Tests
- Run `npm run test` to verify that all test suites, including the new district test suite, compile and pass.
