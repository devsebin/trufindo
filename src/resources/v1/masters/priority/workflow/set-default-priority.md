# Set Default Priority Workflow

**Title:** Set Default Priority Record

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router PATCH /:id/set-default)
    B --> C{paramsValidator}
    C -- Invalid ID format --> D[400 Bad Request]
    C -- Valid ID --> E(setDefault controller method)
    E --> F(setDefaultPriorityService.execute)
    F --> G[Start Mongoose Session & Transaction]
    G --> H(findPriorityHelperService)
    H -- Priority not found --> I[Abort Transaction / Return Error]
    H -- Priority found --> J(UnsetPriorityDefaultHelperService)
    J --> K[Set is_default = false on all other priority records]
    K --> L(setDefaultPriorityHelperService)
    L --> M[Set is_default = true on target priority record]
    M --> N(createDbTransaction logs)
    N --> O[Commit Transaction]
    O --> P[200 OK + Updated default priority details]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in path (valid MongoDB ObjectId representing the priority)

## **Validation & Error Handling**

- If priority is not found -> `priority_not_found`

## **Transaction & Consistency**

- Runs inside a transactional Mongoose session.
- Unsets any existing defaults first to ensure only one record is marked default.
- Logs updates in DbTransaction audits.

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"default_priority_set"`
- Data: Updated default priority document details

### **Error Response:**
- Code: `400 Bad Request` / `404 Not Found`
