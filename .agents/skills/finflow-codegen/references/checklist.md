# FinFlow Definition of Done

Before considering an implementation complete, verify:

- [ ] Correct service owns the functionality and persistence.
- [ ] Existing repository architecture and conventions were inspected.
- [ ] API contract is implemented consistently.
- [ ] Params, query, body, and relevant headers are runtime validated.
- [ ] Authentication is enforced where required.
- [ ] Roles/permissions are enforced where required.
- [ ] Merchant/tenant isolation is enforced for scoped resources.
- [ ] Resource ownership is checked where applicable.
- [ ] Database schema uses appropriate constraints and indexes.
- [ ] Required migration is present and correct.
- [ ] Atomic multi-write operations use transactions.
- [ ] No cross-service database queries or foreign keys were introduced.
- [ ] Errors and logging follow project conventions.
- [ ] Passwords, tokens, API secrets, DB credentials, and sensitive data are protected.
- [ ] Important success and failure paths have tests.
- [ ] Typecheck was run where relevant.
- [ ] Lint was run where relevant.
- [ ] Tests were run where available.
- [ ] Build was run where relevant.
- [ ] No unrelated files or formatting were changed.
- [ ] Final report accurately states what changed and what was validated.

Never mark an item complete based on assumption. Verify it from the repository or actual command output.
