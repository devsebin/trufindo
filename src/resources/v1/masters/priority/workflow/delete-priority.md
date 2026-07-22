# Delete Priority Workflow

**Title:** Soft/Force Delete Priority Level

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router DELETE /:id)
    B --> C{paramsValidator}
    C -- Invalid ID format --> D[400 Bad Request]
    C -- Valid ID --> E(Delete controller method)
    E --> F(deletePriorityService.execute)
    F --> G[Start Mongoose Session & Transaction]
    G --> H[Check if Priority has dependent records in other collections]
    H -- Has dependencies & not force_action --> I[Abort Transaction / Return dependency error]
    H -- No dependencies OR force_action = true --> J[Perform Delete operation]
    J --> K{Is force delete requested?}
    K -- Yes --> L[Hard delete from database]
    K -- No --> M[Soft delete: set is_deleted = true, deleted_at = now]
    L --> N(createDbTransaction log)
    M --> N
    N --> O[Commit Transaction]
    O --> P[200 OK + Deletion confirmation]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in path (valid MongoDB ObjectId)
- **Optional Query parameters:**
  - `force_action` (Boolean)

## **Validation & Error Handling**

- If priority ID is invalid -> `invalid_id`
- If priority does not exist -> `priority_not_found`
- Relational check for other modules using this priority level.

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"priority_deleted"`
- Data: Deleted priority document details

### **Error Response:**
- Code: `400 Bad Request` / `409 Conflict` / `404 Not Found`
