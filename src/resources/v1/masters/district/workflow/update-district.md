# Update District Workflow

**Title:** Update District Details

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router PUT /:id)
    B --> C{paramsValidator}
    C -- Invalid ID format --> D[400 Bad Request]
    C -- Valid ID --> E{validationMiddleware}
    E -- Invalid Payload --> D
    E -- Valid Payload --> F(Update controller method)
    F --> G(updateDistrictService.execute)
    G --> H[Start Mongoose Session & Transaction]
    H --> I(Find district by ID)
    I -- Not found --> J[Abort Transaction / Return Error]
    I -- Found --> K[Check for conflicts in other districts]
    K -- Conflict found --> J
    K -- Clean updates --> L[Apply updates using snapshot changes comparison]
    L --> M(createDbTransaction log)
    M --> N[Commit Transaction]
    N --> O[200 OK + Updated District details]
```

## **Acceptance Criteria**

- **Required parameters:**
  - `id` in path (valid MongoDB ObjectId)
- **Required/Optional Fields:**
  - Updatable fields: `name`, `code`, `country_id`, `region_id`

## **Validation & Error Handling**

- If district is not found -> `district_not_found`
- If modified fields conflict with existing records -> `district_already_exists`
- Checks referenced `country_id` and `region_id` existence.

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"district_updated"`
- Data: Updated district document details

### **Error Response:**
- Code: `400 Bad Request` / `409 Conflict` / `404 Not Found`
