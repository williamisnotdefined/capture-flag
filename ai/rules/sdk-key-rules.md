# SDK Key Rules

Rules for SDK key creation, storage, display, revocation, and public lookup.

## Always

- Generate raw SDK keys with `createRawSdkKey()` and hash them with `hashSdkKey()` before persistence.
- Return the raw SDK key only immediately after creation.
- Persist only `keyHash` and a display-safe `keyPrefix`.
- Require `project_admin` for SDK key creation and revocation.
- Verify `configId` and `environmentId` both belong to the target project before creating a key.
- Write audit logs for SDK key creation and revocation without storing the raw key.
- Treat SDK keys as read-only public config credentials scoped to one config and one environment.

## Never

- Do not store, log, audit, or re-display the raw SDK key after creation.
- Do not use session auth for the public SDK config endpoint.
- Do not expose whether a missing or revoked SDK key ever existed.
- Do not create SDK keys for mismatched config/environment projects.
- Do not allow developer or viewer roles to create or revoke SDK keys unless role policy intentionally changes.
