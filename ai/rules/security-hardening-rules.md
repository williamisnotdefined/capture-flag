# Security Hardening Rules

Rules for API HTTP security, rate limits, and secret handling.

## Always

- Apply HTTP security through `applyHttpSecurity()` in API bootstrap.
- Keep Helmet enabled and HSTS tied to HTTPS-required mode.
- Require explicit CORS origins in production through `CORS_ORIGINS`, `CORS_ORIGIN`, or `CLIENT_BASE_URL`.
- Keep HTTPS required by default in production and configurable locally through `REQUIRE_HTTPS`.
- Use `API_TRUST_PROXY` when deployed behind trusted reverse proxies.
- Hash raw sessions, SDK keys, and API tokens before persistence.
- Keep rate limit bucket keys free of raw SDK keys or raw API tokens.
- Document the MVP rate limit limitation: guards use in-memory Maps and are process-local.
- Add or update regression tests when changing auth, CORS, HTTPS, rate limit, or hash-only credential behavior.

## Never

- Do not weaken production CORS to wildcard origins with credentials.
- Do not persist raw credentials in database rows, logs, audit payloads, or persistent SDK caches.
- Do not treat in-memory rate limits as distributed protection across multiple API instances.
- Do not rely on client-side gates for security; API guards and services remain authoritative.

## Current Rate Limits

- Public SDK config endpoint: global IP bucket plus SDK key/IP bucket.
- Public Management API: IP bucket before Bearer authentication and API token/IP bucket after authentication.
- Both current implementations are suitable for local/MVP operation, not multi-instance abuse protection.
