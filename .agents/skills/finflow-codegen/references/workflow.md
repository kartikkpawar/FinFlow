# FinFlow Implementation Workflow

## 1. Inspect

Before editing, inspect the root package configuration, target service package, TypeScript configuration, database/drizzle configuration, source tree, routes/controllers/services, schemas, middleware, shared packages, migrations, tests, and related Auth/RBAC behavior.

Search for existing implementations before adding helpers, types, routes, or utilities.

## 2. Establish ownership

Determine which service owns the business capability and its durable data. Do not move domain persistence into the API Gateway or duplicate Auth-owned identity/credential state.

For merchant-owned functionality, enforce merchant/tenant scope throughout the request path and persistence queries.

## 3. Design

Define the API contract, actors, authentication requirements, permissions, merchant scope, database changes, transactions, external integrations, and events before implementation.

Prefer the smallest coherent change that fits existing repository conventions.

## 4. Implement

Implement in dependency order:

1. shared contracts/types when genuinely shared
2. database schema
3. migration
4. runtime validation
5. repository/data access
6. business service logic
7. controllers
8. middleware/authz
9. routes
10. gateway routing when required
11. events/integrations when required
12. tests

Keep controllers thin and business rules in services.

## 5. Security review

Verify authentication, permission checks, merchant isolation, ownership checks, input validation, secret handling, and safe error responses. Never trust client-provided userId, role, merchantId, or ownership when trusted auth context exists.

## 6. Validate

Run the repository's applicable typecheck, lint, test, and build commands. At minimum, use existing scripts such as `npm run check-types`, `npm run lint`, `npm run test`, and `npm run build` when available.

Do not claim validation that was not actually run.

## 7. Git

Use a focused feature branch. Keep commits reviewable and avoid unrelated formatting, lockfile churn, secrets, or refactors.

When working through GitHub, inspect the current branch state before updating existing files and use the exact file SHA for updates.

## 8. Report

Summarize implemented functionality, files changed, schema/migrations, routes, authorization, validation results, and any limitations or follow-up work. Never fabricate commit, PR, test, or deployment results.
