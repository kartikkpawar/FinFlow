# FinFlow Database Reference

## Stack

- PostgreSQL
- Drizzle ORM
- one physical PostgreSQL database per service
- service-specific database ownership

## Rules

- each service owns its own PostgreSQL database, tables, and schema definitions
- service-specific DB environment variables must point to that service's database
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

FinFlow uses a separate PostgreSQL database for each service. This provides
physical database isolation while preserving service ownership boundaries.

Current local databases:

- Auth Service -> `finflow_auth`
- Merchant Service -> `finflow_merchants`

Local Docker ports:

- Auth PostgreSQL -> `5433`
- Merchant PostgreSQL -> `5434`

Each service keeps its own connection environment variable:

- `AUTH_DB_URL`
- `MERCHANTS_DB_URL`

Never point service database variables at the same database unless the
architecture is explicitly changed again.

## Schema synchronization

Drizzle schemas live in each service under `src/db/schema.ts`.

From the repository root:

```text
npm run db:push
```

This pushes each service schema to its own database in sequence.

For an individual service, run its workspace `db:push` command.

Do not use a committed SQL migration directory as the FinFlow schema-change
workflow. Generated `drizzle/*.sql` files must not be created or committed.

## Drizzle Studio

From the repository root:

```text
npm run db:studio
```

This starts both service-specific Drizzle Studio instances:

- Auth -> `http://localhost:4983`
- Merchant -> `http://localhost:4984`

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
