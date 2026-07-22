# Update Provider Workflow

**Title:** Update Provider Details

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router PUT /:id)
    B --> C(Update controller method)
    C --> D(updateProviderService.execute)
    D --> E[Start Mongoose Session & Transaction]
    E --> F(Find provider by ID)
    F -- Not found --> G[Abort Transaction / Return Error]
    F -- Found --> H[Check for duplicate name in other records]
    H -- Conflict found --> G
    H -- Clean updates --> I[Apply updates using snapshot changes comparison]
    I --> J(createDbTransaction log)
    J --> K[Commit Transaction]
    K --> L[200 OK + Updated Provider details]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in path (valid MongoDB ObjectId)
- **Updatable fields:**
  - `name` (String, min 1, max 100)
  - `description` (String, min 1, max 100)

## **Validation & Error Handling**

- If provider is not found -> `provider_not_found`
- If modified fields conflict with existing records -> `provider_already_exists`

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"provider_updated"`
- Data: Updated provider document details

### **Error Response:**
- Code: `400 Bad Request` / `409 Conflict` / `404 Not Found`
