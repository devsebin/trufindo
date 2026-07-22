# Create District Workflow

**Title:** Create a New District Record

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router POST /)
    B --> C{validationMiddleware}
    C -- Invalid Payload --> D[400 Bad Request]
    C -- Valid Payload --> E(Store controller method)
    E --> F(createDistrictService.execute)
    F --> G[Start Mongoose Session & Transaction]
    G --> H(findDistrictHelperService)
    H -- District already exists --> I[Abort Transaction / Return Error]
    H -- Unique Details --> J(findCountryHelperService)
    J -- Country not found --> I
    J -- Country exists --> K(findRegionHelperService)
    K -- Region not found --> I
    K -- Region exists --> L(createDistrictHelperService)
    L --> M[Insert District document, set version & metadata]
    M --> N(createDbTransaction log)
    N --> O[Commit Transaction]
    O --> P[201 Created + District Details]
```

## **Acceptance Criteria**

- **Required Fields:**
  - `name` (String, min 1, max 100)
  - `code` (String, min 1, max 10, unique code)
  - `country_id` (valid MongoDB ObjectId, country must exist)
  - `region_id` (valid MongoDB ObjectId, region must exist)

## **Validation & Error Handling**

- If district code/name already exists -> `district_already_exists`
- If country does not exist -> `country_not_found`
- If region does not exist -> `region_not_found`

## **Transaction & Consistency**

- Execution runs inside Mongoose session transaction.
- Rolls back on duplicate details or referenced collection checks failure.
- Logs create transaction on success.

## **Response**

### **Success Response:**
- Code: `201 Created`
- Message: `"district_created"`
- Data: Created district document details

### **Error Response:**
- Code: `400 Bad Request` / `409 Conflict` / `404 Not Found`
