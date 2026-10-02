# FinFlow RBAC Reference

Authorization is composed of:

1. authenticated identity
2. role/permission check
3. merchant membership/tenant check
4. resource ownership check where applicable

Never trust role, userId, or merchantId supplied by an untrusted client.

Known roles:

SUPER_ADMIN
ADMIN
MERCHANT_ADMIN
MERCHANT_USER
ANALYST
SUPPORT

Known permission naming:

<domain>:<action>

Examples:

task:read
task:write
payment:read
payment:write

Always inspect the current RBAC implementation before adding permissions.

## Merchant isolation

A merchant-scoped resource must not be accessible merely because its ID is known.

Prefer database queries that include merchant scope:

WHERE resource.id = ?
AND resource.merchant_id = ?

rather than fetching globally and checking later.

## Privilege changes

Changing merchant membership or roles is security-sensitive.

Require appropriate permissions and validate that the target merchant/user
relationship exists.
