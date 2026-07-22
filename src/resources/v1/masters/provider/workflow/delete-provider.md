# Delete Provider Workflow

**Title:** Soft/Force Delete Provider

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router DELETE /:id)
    B --> C(Delete controller method)
    C --> D(deleteProviderService.execute)
    D --> E[Start Mongoose Session & Transaction]
    E --> F[Check if Provider has dependent records in other collections]
    F -- Has dependencies & not force_action --> G[Abort Transaction / Return dependency error]
    F -- No dependencies OR force_action = true --> H[Perform Delete operation]
    H --> I{Is force delete requested?}
    I -- Yes --> J[Hard delete from database]
    I -- No --> K[Soft delete: set is_deleted = true, deleted_at = now]
    J --> L(createDbTransaction log)
    K --> L
    L --> M[Commit Transaction]
    M --> N[200 OK + Deletion confirmation]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in path (valid MongoDB ObjectId)
- **Optional Query parameters:**
  - `force_action` (Boolean)

## **Validation & Error Handling**

- If provider ID is invalid -> `invalid_id`
- If provider does not exist -> `provider_not_found`

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"provider_deleted"`
- Data: Deleted provider document details

### **Error Response:**
- Code: `400 Bad Request` / `409 Conflict` / `404 Not Found`
