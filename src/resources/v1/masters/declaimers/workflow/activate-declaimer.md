# Activate Declaimer Workflow

**Title:** Enable/Activate Declaimer

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router PATCH /:id/activate)
    B --> C{authenticate & authorization}
    C -- Unauthorized --> D[401/403 Error]
    C -- Authorized --> E{paramsValidator}
    E -- Invalid ID format --> F[400 Bad Request]
    E -- Valid ID --> G(declaimerController.activate)
    G --> H(activateDeclaimerService.execute)
    H --> I[Start Mongoose Session & Transaction]
    I --> J(Find Declaimer by ID)
    J -- Not found --> K[Abort Transaction / Return declaimer_not_found]
    J -- Found --> L[Set is_active = true]
    L --> M(createDbTransaction log)
    M --> N[Commit Transaction]
    N --> O[200 OK + Activated Declaimer details]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in path (valid MongoDB ObjectId)

## **Validation & Error Handling**

- If declaimer is not found -> `declaimer_not_found`

## **Transaction & Consistency**

- Runs inside a transactional session.
- Logs update transaction log upon success.

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"declaimer_activated"`
- Data: Updated declaimer details (`is_active: true`)

### **Error Response:**
- Code: `400 Bad Request` / `404 Not Found`
