# ADR 0001: Adopt a Custom CDN for Static Assets

## Status

Accepted

## Context

The Architecture Blueprint ([docs/project/blueprint.cleaned.html](../project/blueprint.cleaned.html), Draft v0.2) lists CDN as **Deferred** for V1, with client requests going `Client Apps → AWS ALB → API Gateway → Microservices` and no CDN layer in front of it.

Since that blueprint was written, we decided to introduce a CDN now rather than defer it. This decision (recorded in [docs/techstack.md](../techstack.md)) is called out there as an explicit override of the blueprint's deferred-CDN stance.

## Decision

We will front static assets (images and other static files) with a custom CDN, placed ahead of the AWS ALB:

```
Client Apps → CDN → AWS ALB → API Gateway → Microservices
```

This is tracked in [docs/techstack.md](../techstack.md) under Infrastructure and Architectural Boundary as an **override** of the blueprint.

## Consequences

- Static asset delivery (images, uploaded-document thumbnails, branding assets) is offloaded from the ALB/API Gateway path, reducing load on application infrastructure and improving latency for cacheable content.
- Adds an operational component (CDN configuration, cache invalidation, origin setup) that the original V1 blueprint did not plan for.
- Cache invalidation must be considered wherever tenant branding or documents can change (e.g. Hospital Admin updates header/footer branding, Document Service issues a discharge receipt).
- Domain/service logic must not depend on the CDN directly — it remains an edge/infrastructure concern, consistent with the Architectural Boundary principle in [docs/techstack.md](../techstack.md).
- This diverges from the blueprint's documented V1 scope; readers of the blueprint should cross-reference this ADR and techstack.md to avoid assuming CDN is still deferred.
