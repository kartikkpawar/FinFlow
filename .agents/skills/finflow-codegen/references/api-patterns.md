# FinFlow API Patterns

Use the existing response/error conventions.

Typical layers:

request
-> gateway
-> auth
-> authorization
-> validation
-> controller
-> service
-> repository/DB

Controllers should remain thin.

Services contain business logic.

Repositories contain database access where the service uses a repository layer.

Validate params/query/body at runtime.

Do not trust frontend-provided ownership or authorization data.

## Lists

Use bounded pagination.

Whitelist filter/sort fields.

Do not construct SQL with string concatenation.

## Errors

Preserve existing error classes/codes/response envelope.

Never leak:

- secrets
- passwords
- tokens
- stack traces
- DB credentials
