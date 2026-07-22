# Link/Unlink Countries Workflow

**Title:** Link and Unlink Supporting Countries to/from Provider

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B{Action?}
    B -- Link Country PUT /:id/link-countries --> C{validationMiddleware}
    C -- Invalid Payload --> D[400 Bad Request]
    C -- Valid Payload --> E(providerController.linkCountries)
    E --> F(linkProviderCountryService.execute)
    F --> G[Start Mongoose Session]
    G --> H(findCountryHelperService)
    H -- Country not found --> I[Abort Transaction / Return Error]
    H -- Country exists --> J[Update provider supporting countries config list]
    J --> K[Commit & Return 200 OK]

    B -- Unlink Country GET /:id/unlink-countries/:country_id --> L(providerController.unlinkCountries)
    L --> M[Remove country from provider supporting countries list in DB]
    M --> N[Return 200 OK]
```

## **Acceptance Criteria**

### **Link Countries Required Fields:**
- `countryId` (valid MongoDB ObjectId, must exist)
- `supportFrom` (Date)
- `config` (Object, containing webhook URL, headers, API keys etc.)

### **Unlink Countries Required Parameters:**
- `id` (Provider ObjectId in path)
- `country_id` (Country ObjectId in path)

## **Response**

### **Success Response:**
- Code: `200 OK`
- Message: `"countries_linked"` / `"countries_unlinked"`
- Data: Updated provider document
