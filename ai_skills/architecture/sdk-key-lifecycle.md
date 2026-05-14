# SDK Key Lifecycle Architecture

SDK keys authenticate public config reads without session auth.

## Creation

1. Private API requires `project_admin` through `AccessService.requireProjectRole`.
2. Service verifies the selected config and environment belong to the same project.
3. `createRawSdkKey()` creates the only raw key shown to the user.
4. `hashSdkKey()` stores the lookup hash; `keyPrefix` is stored for display.
5. Creation writes an audit log without storing the raw key.

## Public Config Lookup

- The public SDK endpoint hashes the raw key from the route and looks up `sdk_keys.key_hash`.
- Missing or revoked keys return not found without revealing existence.
- Valid keys scope the public config response to one config and one environment.
- Valid accesses update `lastUsedAt`, including `304 Not Modified` responses.

## Revocation

Revocation requires `project_admin`, sets `revokedAt`, and writes an audit log. Revoked keys cannot fetch public config.
