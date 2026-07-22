# Create User Workflow

**Title:** Create User Profile

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router POST /)
    B --> C{validationMiddleware}
    C -- Invalid Payload --> D[400 Bad Request]
    C -- Valid Payload --> E(Store controller method)
    E --> F(createUserService.execute)
    F --> G[Start Mongoose Session & Transaction]
    G --> H(findUserHelperService)
    H -- Email/Phone match found --> I(validateUniqueFields)
    I -- Throw email/phone exists error --> J[Abort Transaction / Return Error]
    H -- No match found --> K(createUserHelperService)
    K --> L[Generate user record, hash password, insert in DB]
    L --> M(createDbTransaction log)
    M --> N[Commit Transaction]
    N --> O[200 OK / 201 Created + User object]
```

## **Acceptance Criteria**

- **Required Fields:**
  - `email` (String, valid email)
  - `phone` (String, E.164 phone format)
  - `password` (String, hashed internally)
  - `user_type` (String)
  - `first_name` (String)
  - `last_name` (String)

## **Validation & Error Handling**

- If user with same email exists -> `email_already_exists`
- If user with same phone exists -> `phone_already_exists`

## **Transaction & Consistency**

- Runs inside a Mongoose session transaction.
- Rolls back changes on constraint checks failure.
- Successful user creation stores record and inserts transactional details into database.

## **Response**

### **Success Response:**
- Code: `200 OK` / `201 Created`
- Message: `"user_created"`
- Data: User document details

### **Error Response:**
- Code: `400 Bad Request` / `409 Conflict`

## **Core Functions / Class Responsibilities**

| Function / Class | Responsibility |
| --- | --- |
| createUserService | Manages user checks and transaction lifetime. |
| findUserHelperService | Queries existing database users for email or phone conflicts. |
| createUserHelperService | Inserts User document and triggers database transaction audits. |
