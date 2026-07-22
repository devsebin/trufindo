# Create Priority Workflow

**Title:** Create a New Priority Level

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router POST /)
    B --> C{validationMiddleware}
    C -- Invalid Payload --> D[400 Bad Request]
    C -- Valid Payload --> E(Store controller method)
    E --> F(createPriorityService.execute)
    F --> G[Start Mongoose Session & Transaction]
    G --> H(findPriorityHelperService)
    H -- Priority with same title/color exists --> I[Abort Transaction / Return Error]
    H -- Unique details --> J(createPriorityHelperService)
    J --> K[Insert Priority document, set defaults & metadata]
    K --> L(createDbTransaction log)
    L --> M[Commit Transaction]
    M --> N[201 Created + Priority Details]
```

## **Acceptance Criteria**

- **Required Fields:**
  - `title` (String, min 1, max 100, unique)
  - `color` (String, min 1, max 100, hex color or style descriptor)

## **Validation & Error Handling**

- If priority with duplicate title/color exists -> `priority_already_exists`

## **Transaction & Consistency**

- Runs inside a transactional session.
- Failure of duplicates check rolls back all operations.
- Logs create transaction on success.

## **Response**

### **Success Response:**
- Code: `201 Created`
- Message: `"priority_created"`
- Data: Created priority document details

### **Error Response:**
- Code: `400 Bad Request` / `409 Conflict`
