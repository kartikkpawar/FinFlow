# FinFlow Database Reference

## Stack

- PostgreSQL
- Drizzle ORM
- one shared physical PostgreSQL database
- logical schema ownership remains service-specific

## Rules

- each service owns its own tables and schema definitions
- services may use service-specific DB environment variables that point to the shared PostgreSQL database
- never query another service's tables directly from application code
- no cross-service foreign keys
- `src/db/schema.ts` is the source of truth for service-owned schema
- do not create or commit generated SQL files under `drizzle/`
- use the configured Drizzle schema push workflow (`db:push`) for schema changes
- use constraints for durable invariants
- index actual query patterns
- scope merchant-owned queries by merchantId
- use transactions for atomic multi-write operations

## Database topology

FinFlow currently uses one PostgreSQL database for all services. This is a
physical infrastructure decision, not a change to service ownership.

Services must continue to behave as independently owned data domains. Each
service should retain its own database module and service-specific connection
environment variable, even when those variables point to the same PostgreSQL
database.

This keeps the code ready for future database separation without changing the
domain/service boundaries.

## Schema synchronization

Drizzle schemas live in each service under `src/db/schema.ts`.

Use:

```text
npm run db:push
```

or the equivalent workspace command for the target service.

Do not use a committed SQL migration directory as the FinFlow schema-change
workflow. Generated `drizzle/*.sql` files must not be created or committed.

## Merchant statuses currently known

- PENDING
- ACTIVE
- SUSPENDED
- INACTIVE
- REJECTED

Do not assume every transition is valid. Implement explicit transitions when
the domain requires them.

## Typical merchant relationship

A user is an identity owned by Auth Service.

Merchant Service stores the user's relationship to a merchant, such as:

- merchantId
- userId
- merchant role
- membership state
- timestamps

Do not duplicate passwords or credentials.

## Security-sensitive values

API secrets, refresh tokens, passwords, and other credentials must never be
stored/logged/returned in plaintext unless the architecture explicitly requires
recoverable encryption.
