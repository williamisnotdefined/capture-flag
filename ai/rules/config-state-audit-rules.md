# Config State And Audit Rules

Rules for config environment state, revision bumps, ETags, and audit logs.

## Always

- Treat `config_environment_states` as the source of public config `revision`, `ETag`, and `generatedAt`.
- Bump config environment state only when SDK-visible output changes.
- Use `bumpConfigEnvironmentState()` inside the same transaction as the SDK-visible write.
- Generate ETags through `createConfigEnvironmentEtag()` instead of duplicating string format logic.
- Write audit logs for security-sensitive or domain-significant writes such as flag changes and SDK key lifecycle changes.
- Write audit logs for segment create, update, and delete operations.
- Write audit logs for member changes, config lifecycle changes, and config publication events.
- Use `toAuditJson()` when persisting old/new/metadata snapshots.

## Never

- Do not bump revision or ETag for no-op writes.
- Do not bump public config state for UI-only metadata unless it is emitted in Config JSON.
- Do not write audit logs outside the transaction that performs the audited mutation.
- Do not include raw secrets, raw session tokens, raw SDK keys, or OAuth tokens in audit payloads.
- Do not hand-build config environment ETags in services.
- Do not cascade-delete audit logs when tenant-owned resources are removed.
