# SDK Key Management

Use this skill when changing SDK key creation, display, hashing, revocation, public lookup, or related audit behavior.

## Goal

Preserve SDK keys as hashed read-only credentials scoped to one config and one environment.

## Read First

- `ai_skills/rules/sdk-key-rules.md`
- `ai_skills/rules/api-tenant-access-rules.md`
- `ai_skills/architecture/sdk-key-lifecycle.md`
- `ai_skills/glossary/config-sdk-terms.md`
- `ai_skills/examples/good-sdk-key-service.md`

## Workflow

- Require project admin access for private SDK key writes.
- Verify config and environment ownership before creating a key.
- Keep raw key generation and hashing in `sdk-key-crypto`.
- Return raw keys only from creation responses.
- Audit lifecycle changes with `keyPrefix`, not raw keys.

## Expected Output

- Raw SDK keys are never stored, logged, or re-displayed.
- Public lookup remains hash-based and sessionless.
- Revoked keys cannot fetch public config.

## Verification

- Run `npm --workspace @capture-flag/api run test` after SDK key behavior changes.
- Run `npm --workspace @capture-flag/api run build` after service or controller changes.
