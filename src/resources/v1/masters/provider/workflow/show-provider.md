# Show Provider Workflow

**Title:** Get Provider Details by ID

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router GET /:id)
    B --> C(Show controller method)
    C --> D(showProviderService.execute)
    D --> E[Start Mongoose Session & Transaction]
    E --> F[Query Provider by ID]
    F -- Not found --> G[Abort Transaction / Return Error]
    F -- Found --> H(createDbTransaction log)
    H --> I[Commit Transaction]
    I --> J[200 OK + Provider details]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in request path (valid MongoDB ObjectId)

## **Validation & Error Handling**

- If provider does not exist -> `provider_not_found`

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"provider_shown"`
- Data: Provider document details

### **Error Response:**
- Code: `400 Bad Request` / `404 Not Found`
