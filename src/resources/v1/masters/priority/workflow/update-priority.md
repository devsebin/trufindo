# Update Priority Workflow

**Title:** Update Priority Details

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router PUT /:id)
    B --> C{paramsValidator}
    C -- Invalid ID format --> D[400 Bad Request]
    C -- Valid ID --> E{validationMiddleware}
    E -- Invalid Payload --> D
    E -- Valid Payload --> F(Update controller method)
    F --> G(updatePriorityService.execute)
    G --> H[Start Mongoose Session & Transaction]
    H --> I(Find priority by ID)
    I -- Not found --> J[Abort Transaction / Return Error]
    I -- Found --> K[Check for title/color conflicts in other records]
    K -- Conflict found --> J
    K -- Clean updates --> L[Apply updates using snapshot changes comparison]
    L --> M(createDbTransaction log)
    M --> N[Commit Transaction]
    N --> O[200 OK + Updated Priority details]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in path (valid MongoDB ObjectId)
- **Required/Optional Fields:**
  - Updatable fields: `title`, `color`

## **Validation & Error Handling**

- If priority is not found -> `priority_not_found`
- If modified fields conflict with existing records -> `priority_already_exists`

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"priority_updated"`
- Data: Updated priority document details

### **Error Response:**
- Code: `400 Bad Request` / `409 Conflict` / `404 Not Found`
