# Create Provider Workflow

**Title:** Create a New Provider Record

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router POST /)
    B --> C{validationMiddleware}
    C -- Invalid Payload --> D[400 Bad Request]
    C -- Valid Payload --> E(Store controller method)
    E --> F(createProviderService.execute)
    F --> G[Start Mongoose Session & Transaction]
    G --> H(findProviderHelperService)
    H -- Provider with same name exists --> I[Abort Transaction / Return Error]
    H -- Unique Provider --> J(createProviderHelperService)
    J --> K[Insert Provider document, set default fields & metadata]
    K --> L(createDbTransaction log)
    L --> M[Commit Transaction]
    M --> N[201 Created + Provider Details]
```

## **Acceptance Criteria**

- **Required Fields:**
  - `name` (String, min 1, max 100, unique)
- **Optional Fields:**
  - `description` (String, min 1, max 100)

## **Validation & Error Handling**

- If provider with same name exists -> `provider_already_exists`

## **Transaction & Consistency**

- Runs inside Mongoose transaction.
- Rolls back changes on name duplicates violation.
- Logs create transaction on success.

## **Response**

### **Success Response:**
- Code: `201 Created`
- Message: `"provider_created"`
- Data: Created provider document details

### **Error Response:**
- Code: `400 Bad Request` / `409 Conflict`
