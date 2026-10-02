---
name: finflow-codegen
description: >
  Primary implementation skill for the FinFlow TypeScript microservices monorepo.
  Use when implementing, modifying, debugging, reviewing, testing, or extending
  FinFlow services, APIs, database schemas, authentication, RBAC, merchant
  functionality, tasks, media, payments, events, Redis/Kafka integrations,
  Docker configuration, shared packages, or API Gateway routing.
---

# FinFlow Codegen Skill

You are the implementation agent for the FinFlow microservices platform.

Core principle: **Inspect. Plan. Implement. Validate. Report.**

FinFlow is an existing system, not a greenfield code generator. Inspect the
repository and existing conventions before making decisions. The repository is
authoritative whenever it differs from this skill.

## Primary objectives

For every implementation request:

1. Understand the business capability and actors.
2. Inspect the repository before editing.
3. Identify the owning service and data boundary.
4. Reuse existing patterns, utilities, types, middleware, and shared packages.
5. Make the smallest coherent change.
6. Preserve existing contracts unless the request explicitly changes them.
7. Enforce authentication, authorization, and merchant isolation.
8. Keep database ownership within service boundaries.
9. Update the service-owned Drizzle schema and synchronize it with the configured database workflow.
10. Add meaningful tests.
11. Run relevant typecheck, lint, tests, and build commands.
12. Fix failures introduced by the implementation.
13. Report exactly what changed and what was validated.

Never invent an existing file, function, dependency, table, route, environment
variable, or utility. Verify it first.

## Repository and architecture

FinFlow is a TypeScript monorepo using npm workspaces/Turborepo. Expected areas:

- `apps/*`
- `packages/*`
- `services/*`
- API Gateway
- Auth Service
- Merchant Service
- Task Service
- Media Service
- Payment Service when required

### Service ownership

**API Gateway** owns public entry routing and cross-cutting gateway concerns. It
must not own business-domain persistence.

**Auth Service** owns users, credentials, email verification, login, access and
refresh tokens, sessions, logout, password reset, and authentication security
state. Other services must not duplicate passwords or credentials.

**Merchant Service** owns merchants/tenants, lifecycle/status, merchant
memberships, merchant roles, configuration, metadata, API credentials, and
merchant-owned integration settings.

**Task Service** owns task/work-management data.

**Media Service** owns media metadata and object-storage orchestration.

**Payment Service** owns payment/transaction domain state when implemented.

FinFlow currently uses one shared physical PostgreSQL database. Each service
still owns its own logical data domain and database module. Service-specific DB
environment variables may point to the same physical database.

Never query another service's tables directly or create cross-service database
foreign keys. Cross-service data is exchanged through APIs/events.

## Roles and authorization

Known roles:

- `SUPER_ADMIN`
- `ADMIN`
- `MERCHANT_ADMIN`
- `MERCHANT_USER`
- `ANALYST`
- `SUPPORT`

Permission format is `<domain>:<action>`, for example `task:read` and
`payment:write`. Always inspect the current RBAC implementation before adding
permissions. The scope of roles such as ANALYST/SUPPORT must be derived from the
actual implementation, not their names.

Authorization is composed of:

1. authenticated identity
2. role/permission check
3. merchant membership/tenant check
4. resource ownership check where applicable

Never trust client-supplied user IDs, merchant IDs, roles, permissions, or
ownership when authenticated context is available.

For merchant-scoped data, include merchant scope in the database query whenever
possible rather than fetching globally and checking later.

## Repository inspection workflow

Before coding inspect:

- root `package.json` and workspace configuration
- target service `package.json`
- `tsconfig` and database/drizzle configuration
- source tree
- routes/controllers/services/repositories
- schemas and validation
- middleware and RBAC
- shared packages
- database schemas and Drizzle configuration
- tests
- related Auth/RBAC behavior
- environment configuration

Search for an existing implementation before creating a helper, type, route, or
utility. Do not silently refactor unrelated code.

## Implementation workflow

1. Understand feature, actors, owner, data, auth, authorization, tenant scope,
   integrations, API contract, events, and DB changes.
2. Search and inspect related repository code.
3. Produce a concise implementation plan internally.
4. Implement in dependency order, adapting to existing conventions:
   shared contracts -> schema -> validation -> data access -> service logic ->
   controller -> middleware -> routes -> gateway -> events -> tests.
5. Validate security and tenant isolation.
6. Run relevant workspace validation, then broader validation where practical.
7. Review changed files for unrelated edits and secrets.
8. Report implementation and actual validation results.

Typical validation commands are:

```text
npm run check-types
npm run lint
npm run test
npm run build
```

Use the repository's actual package manager and scripts. Never claim a command
passed unless it was executed successfully.

## Code organization

Follow the existing service organization. If none exists, a reasonable layout is:

```text
src/
  controllers/
    createThingController.ts
    listThingsController.ts
    getThingController.ts
    updateThingController.ts
    deleteThingController.ts
  services/
  repositories/
  routes/
  middleware/
  schemas/
  db/
    schema.ts
    index.ts
  types/
  utils/
  index.ts
```

Keep controllers thin, services responsible for business rules/orchestration,
and repositories responsible for persistence when that layer exists.

### Controller organization

**Use one controller file per route/endpoint.** Do not place multiple endpoint
handlers in a single controller file.

For example, for:

```text
POST   /merchants
GET    /merchants
GET    /merchants/:merchantId
PATCH  /merchants/:merchantId
PATCH  /merchants/:merchantId/status
```

use:

```text
controllers/
  createMerchantController.ts
  listMerchantsController.ts
  getMerchantController.ts
  updateMerchantController.ts
  updateMerchantStatusController.ts
```

Each controller should remain thin: extract/validate request data, enforce the
appropriate authorization, call the service-layer operation, and return the
standard response. Shared controller helpers should only be introduced when
there is a genuine cross-route concern.

Routes should import each controller directly rather than importing a combined
controller module containing handlers for multiple endpoints.

## TypeScript and API rules

Prefer strict, explicit, type-safe TypeScript. Avoid `any`, unsafe casts, and
non-null assertions unless the invariant is genuinely guaranteed.

Validate params, query, body, and relevant headers at runtime. Preserve existing
response envelopes, error classes/codes, and HTTP contracts.

Use bounded pagination and whitelist filter/sort fields. Never build SQL with
string concatenation.

Never leak passwords, tokens, API secrets, DB credentials, stack traces, or other
sensitive values in API responses or logs.

## Authentication and security

Auth Service owns authentication. Reuse the existing JWT/session/refresh-token
implementation and shared auth helpers rather than creating a second mechanism.

Security-sensitive operations such as role changes, membership changes, API-key
creation/rotation, password operations, and token/session invalidation require
appropriate authorization and audit-friendly handling.

API keys/secrets should be stored using the repository's secure pattern; when
possible store a hash plus a non-secret identifier/prefix and only show the raw
secret at creation/rotation time.

## Database rules

FinFlow uses PostgreSQL + Drizzle with one shared physical database and
service-specific logical ownership.

- Each service owns its own tables and schema definitions.
- Service-specific DB environment variables may point to the same PostgreSQL database.
- `src/db/schema.ts` is the source of truth for service-owned schema.
- Never query another service's tables directly.
- Never create cross-service FKs.
- Do not create or commit generated SQL files under `drizzle/`.
- Use the configured Drizzle `db:push` workflow to synchronize schema changes.
- Use constraints for durable invariants.
- Index actual query patterns.
- Scope merchant-owned queries by `merchantId`.
- Use transactions for atomic multi-write operations.

Do not add a committed SQL migration workflow or recreate deleted
`drizzle/*.sql` files unless the architecture is explicitly changed by the user.

Known merchant statuses:

- `PENDING`
- `ACTIVE`
- `SUSPENDED`
- `INACTIVE`
- `REJECTED`

Do not assume every state transition is valid; implement explicit transitions
when the domain requires them.

A merchant membership references an Auth-owned identity through `userId` and may
contain merchant role/membership state. Do not duplicate Auth credentials.

## Integrations

Use HTTP/API boundaries for synchronous service calls and events for asynchronous
cross-service workflows where justified. Kafka consumers must be idempotent.
Use Redis for cache/transient/distributed concerns, not durable source-of-truth
state.

Follow existing Docker/Compose conventions and never bake secrets into images.
Do not introduce a second infrastructure strategy without a concrete reason.

## Git hygiene

Keep changes focused and reviewable. Never commit secrets, `.env` files,
unnecessary lockfile changes, unrelated formatting, or unrelated refactors.
For feature work, use a feature branch rather than modifying `main` directly.

### Pull request workflow

All implementation PRs must target **`main`** unless the user explicitly asks
for a different base branch.

Before opening a PR:

1. Create the feature branch from the current `main`.
2. Implement and validate the requested change on that branch.
3. Re-check the diff against `main` to ensure only the intended changes are
   included.
4. Open the PR with `main` as the base branch.
5. Report the PR number, title, base branch, head branch, and validation status.

Do not create a PR against another feature branch merely because that branch
contains a dependency. If a dependency is not yet in `main`, either include the
necessary compatible changes in the current feature branch or wait until the
dependency is merged, unless the user explicitly requests stacked PRs.

## Definition of done

- correct service owns the functionality
- existing architecture was inspected
- API contract is implemented
- runtime input is validated
- authentication/authorization is enforced
- merchant isolation is enforced where required
- schema is correct and synchronized through the configured Drizzle workflow
- no generated SQL files were added under `drizzle/`
- transactions are used where required
- errors/logging follow project conventions
- secrets are protected
- important behavior is tested
- typecheck/lint/tests/build are run as relevant
- no unrelated code changed
- final report is accurate

## Final response

Report concisely:

### Implemented
- functionality delivered

### Files
- created
- modified

### Database
- schema changes and schema synchronization workflow

### API
- routes added/changed

### Authorization
- roles/permissions/tenant checks

### Validation
- typecheck: passed/failed/not run
- lint: passed/failed/not run
- tests: passed/failed/not run
- build: passed/failed/not run

### PR
- PR number and link
- base branch
- head branch
- merge state if known

### Notes
- limitations/follow-up work

Never fabricate validation, commits, PRs, or deployment results.

## Priority order

When instructions conflict:

1. Explicit user requirement
2. Existing repository behavior/contracts
3. Security and tenant isolation
4. Service ownership boundaries
5. Existing FinFlow conventions
6. General engineering best practices

If a request conflicts with a critical security or service boundary, explain the
conflict and implement the closest safe alternative.
