# User Story: Get Declaimer Details

**Title:** As an Admin, I want to fetch a declaimer by ID.

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router GET /:id)
    B --> C{authenticate & authorization}
    C -- Unauthorized --> D[401/403 Error]
    C -- Authorized --> E{paramsValidator}
    E -- Invalid ID format --> F[400 Bad Request]
    E -- Valid ID --> G(declaimerController.Show)
    G --> H(showDeclaimerService.execute)
    H --> I[Start Mongoose Session & Transaction]
    I --> J[Query Declaimer by ID]
    J -- Not found --> K[Abort Transaction / Return declaimer_not_found]
    J -- Found --> L(createDbTransaction log)
    L --> M[Commit Transaction]
    M --> N[200 OK + Declaimer details]
```

## **Acceptance Criteria**

When fetching a declaimer:

### **Required Input:**

- object_id → must be a valid MongoDB ObjectId.

## **Validation Rules**

- object_id must be a valid MongoDB ObjectId.
- If object_id is invalid:
  - Return **invalid_id** error.
- If no declaimer is found for the given ID:
  - Return **declaimer_not_found** error.

## **Data Retrieval Behavior**

- The declaimer is fetched using its unique ObjectId.
- Related fields are populated using predefined `populateFields`.
- The result is returned as a formatted response.

## **Transaction & Audit Trail**

- Operation runs inside a **Mongoose session**.
- Steps executed within transaction:
  1. Validate ObjectId format.
  2. Validate declaimer existence.
  3. Fetch declaimer with populated fields.
  4. Record database transaction log.

- On failure:
  - Transaction is **aborted**.
  - No partial operations are committed.

- On success:
  - Transaction is **committed**.

## **Audit Logging**

- Each fetch operation is recorded using `createDbTransaction`:
  - table: Declaimers
  - method: GET
  - operation: Read
  - payload: fetched declaimer
