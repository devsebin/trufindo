# Show Priority Workflow

**Title:** Get Priority Details by ID

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router GET /:id)
    B --> C{paramsValidator}
    C -- Invalid ID format --> D[400 Bad Request]
    C -- Valid ID --> E(Show controller method)
    E --> F(showPriorityService.execute)
    F --> G[Start Mongoose Session & Transaction]
    G --> H[Query Priority by ID]
    H -- Not found --> I[Abort Transaction / Return Error]
    H -- Found --> J(createDbTransaction log)
    J --> K[Commit Transaction]
    K --> L[200 OK + Priority details]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in path (valid MongoDB ObjectId)

## **Validation & Error Handling**

- If priority does not exist -> `priority_not_found`

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"priority_shown"`
- Data: Priority document details

### **Error Response:**
- Code: `400 Bad Request` / `404 Not Found`
