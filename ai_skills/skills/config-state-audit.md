# Config State And Audit

Use this skill when changing revision bumps, ETags, config environment state rows, public config invalidation, or audit logs.

## Goal

Keep SDK-visible state changes, public cache metadata, and audit logs consistent and transactional.

## Read First

- `ai_skills/rules/config-state-audit-rules.md`
- `ai_skills/rules/public-config-rules.md`
- `ai_skills/architecture/config-state-audit-flow.md`
- `ai_skills/architecture/public-config-flow.md`
- `ai_skills/examples/good-config-state-audit.md`

## Workflow

- Determine whether the change affects public Config JSON.
- Use `bumpConfigEnvironmentState()` only for SDK-visible changes.
- Keep state bumps and audited mutations in the same Prisma transaction.
- Use `createAuditLog()` and `toAuditJson()` for audit payloads.
- Check no-op paths do not bump revision or emit audit entries unless behavior intentionally changes.

## Expected Output

- Public config revision, ETag, and generated timestamp stay consistent.
- Audit payloads are sanitized and tenant-scoped.
- No raw credentials appear in audit logs.

## Verification

- Run API tests covering changed public config or audit behavior.
- Run `npm --workspace @capture-flag/api run build` after service/helper changes.
