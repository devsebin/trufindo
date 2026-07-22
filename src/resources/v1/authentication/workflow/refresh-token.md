# Refresh Token Workflow

**Title:** Refresh Token Rotation Lifecycle

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B(Express Router /refresh-token)
    B --> C{validationMiddleware}
    C -- Missing refresh token --> D[400 Bad Request]
    C -- Token provided --> E(authenticationController.Refresh)
    E --> F(refreshTokenService.execute)
    F --> G[Start Mongoose Session & Transaction]
    G --> H(verifyToken)
    H -- Invalid/Expired JWT --> I[Abort Transaction / Return Error]
    H -- Valid Token JWT --> J(getSession)
    J -- Session not found --> I
    J -- Session found --> K(getUser)
    K -- User not found --> I
    K -- User found --> L(validateSession)
    L -- Session revoked --> I
    L -- Session active --> M(validateTokenMatch)
    M -- Hash Mismatch --> N[Revoke ALL sessions for User & Abort / Return Error]
    M -- Hash Match --> O(generateTokens)
    O --> P(rotateSession)
    P --> Q[Update tokenId, hash new refreshToken, save]
    Q --> R(createDbTransaction log)
    R --> S[Commit Transaction]
    S --> T[200 OK + New JWT access & refresh tokens]
```

## **Acceptance Criteria**

- **Required Fields:**
  - `refresh_token` (String, in body)

## **Validation & Error Handling**

- If token verification fails -> `invalid_refresh_token`
- If session matching token `jti` is not found -> `session_not_found`
- If user associated with the token is not found -> `user_not_found`
- If session is already marked revoked -> `session_revoked`
- If token hash mismatch occurs -> `invalid_refresh_token` (and all user sessions are immediately revoked as a security precaution)

## **Transaction & Consistency**

- All steps run within a Mongoose session.
- Commits token rotation details on success. Rolls back on error.
- Implements immediate security revocation of all sessions on token misuse detection.

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"token_refreshed"`
- Data: User object, accessToken, refreshToken, tokenType (`"Bearer"`)

### **Error Response:**
- Code: `400 Bad Request` / `401 Unauthorized` / `404 Not Found`

## **Core Functions / Class Responsibilities**

| Function / Class | Responsibility |
| --- | --- |
| refreshTokenService | Coordinates token validation, session check, hash matching, and rotation lifecycle. |
| verifyToken | Checks token format, signature, and retrieves the token payload. |
| getSession | Retrieves session document from database using `jti`. |
| validateSession | Checks that the session has not been revoked. |
| validateTokenMatch | Validates current token against stored hash; triggers complete user revocation on failure. |
| rotateSession | Updates session document with new token identifier, expiration, and hashed value. |
