# Deactivate Priority Workflow

**Title:** Disable/Deactivate Priority Record

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router PATCH /:id/disable)
    B --> C{paramsValidator}
    C -- Invalid ID format --> D[400 Bad Request]
    C -- Valid ID --> E(deactivate controller method)
    E --> F(disablePriorityService.execute)
    F --> G[Start Mongoose Session & Transaction]
    G --> H(Find Priority by ID)
    H -- Not found --> I[Abort Transaction / Return Error]
    H -- Found --> J[Set is_active = false]
    J --> K(createDbTransaction log)
    K --> L[Commit Transaction]
    L --> M[200 OK + Deactivated priority details]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in path (valid MongoDB ObjectId)

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"priority_deactivated"`
- Data: Updated priority details (`is_active: false`)

### **Error Response:**
- Code: `400 Bad Request` / `404 Not Found`
