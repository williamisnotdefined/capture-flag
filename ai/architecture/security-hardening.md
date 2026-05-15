# Security Hardening Architecture

Capture Flag applies MVP hardening at API bootstrap and sensitive route guards.

## HTTP Boundary

- `applyHttpSecurity()` installs Helmet, CORS, optional trust proxy, and HTTPS enforcement.
- Production always requires HTTPS.
- Local development can set `REQUIRE_HTTPS=false`.
- Deployments behind a proxy must configure `API_TRUST_PROXY` so Express sees the intended protocol and IP.

## CORS

- CORS allows credentials for the configured client origins.
- Production must provide an explicit origin list through `CORS_ORIGINS`, `CORS_ORIGIN`, or `CLIENT_BASE_URL`.
- Local development falls back to `http://localhost:5173`.

## Hash-Only Credentials

- Sessions store only token hashes in `sessions.token_hash`.
- SDK keys store only `key_hash` plus `key_prefix`.
- API tokens store only `token_hash` plus `token_prefix`.
- Audit logs and support-facing data use prefixes or IDs, never raw credentials.

## Rate Limit Boundaries

- Public SDK config requests are limited by IP and SDK key/IP.
- Public Management API Bearer requests are limited by IP before auth and API token/IP after auth.
- Current guards use in-memory Maps; every API process has independent counters.
- Multi-instance deployments need a distributed limiter before claiming platform-wide abuse protection.
