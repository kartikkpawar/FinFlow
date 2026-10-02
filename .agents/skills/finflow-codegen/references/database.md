# FinFlow Database Reference

## Stack

- PostgreSQL
- Drizzle ORM
- one database per service

## Rules

- service owns its schema
- no cross-service foreign keys
- use migrations
- use constraints for durable invariants
- index actual query patterns
- scope merchant-owned queries by merchantId
- use transactions for atomic multi-write operations

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
