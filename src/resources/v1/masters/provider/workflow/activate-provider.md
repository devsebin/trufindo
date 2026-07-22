# Activate Provider Workflow

**Title:** Enable/Activate Provider Record

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router PATCH /:id/enable)
    B --> C(activate controller method)
    C --> D(enableProviderService.execute)
    D --> E[Start Mongoose Session & Transaction]
    E --> F(Find Provider by ID)
    F -- Not found --> G[Abort Transaction / Return Error]
    F -- Found --> H[Set is_active = true]
    H --> I(createDbTransaction log)
    I --> J[Commit Transaction]
    J --> K[200 OK + Activated provider details]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in path (valid MongoDB ObjectId)

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"provider_activated"`
- Data: Updated provider details (`is_active: true`)

### **Error Response:**
- Code: `400 Bad Request` / `404 Not Found`
