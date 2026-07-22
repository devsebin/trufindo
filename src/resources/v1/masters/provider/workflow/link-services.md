# Link Services/Test Provider (Draft) Workflow

**Title:** Provider Service Configuration and Verification (Draft Placeholder)

> [!NOTE]
> These endpoints are currently stubs and route to an empty placeholder handler.

## **Workflow Diagram**

```mermaid
flowchart TD
    A[Client Request] --> B{Route?}
    B -- Link GET /:id/link-services/:country_id --> C(providerController.linkServices)
    B -- Unlink GET /:id/unlink-services/:country_id/service/:service_id --> C
    B -- Test GET /:id/test/:country_id/service/:service_id --> C
    C --> D[Placeholder Response]
```

## **Proposed Acceptance Criteria**

- Validation of `id`, `country_id`, and `service_id` existence.
- Verification of network ping or API handshake with external provider gateways.
