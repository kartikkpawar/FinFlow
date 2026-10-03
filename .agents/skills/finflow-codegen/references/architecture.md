# FinFlow Architecture Reference

## Repository

FinFlow is a TypeScript microservices monorepo using Turborepo/workspaces.

Conceptual layout:

- apps/*
- packages/*
- services/*
- api-gateway
- auth-service
- merchant-service
- task-service
- media-service
- payment-service (when implemented)

The repository is authoritative if its current structure differs.

## Core services

### API Gateway

Public entry point and routing layer. It may perform gateway-level authentication
and cross-cutting middleware but must not own business-domain persistence.

### Auth Service

Identity, credentials, sessions, JWT/access tokens, refresh tokens, email
verification, login/logout, password reset.

### Merchant Service

Merchant/tenant records, merchant lifecycle, memberships, merchant roles,
configuration, API credentials and merchant-owned integration configuration.

### Task Service

Tasks and work-management data.

### Media Service

Upload/media metadata and object-storage orchestration.

### Payment Service

Payment and transaction domain when implemented.

## Data ownership

Each service owns its PostgreSQL database. Never query another service's DB
directly. Cross-service data uses APIs/events.

## Existing known roles

- SUPER_ADMIN
- ADMIN
- MERCHANT_ADMIN
- MERCHANT_USER
- ANALYST
- SUPPORT

Scope of ANALYST/SUPPORT must be determined from the current RBAC implementation
rather than inferred from names.

## Known permission style

- task:read
- task:write
- payment:read
- payment:write

Reuse current permission definitions.
