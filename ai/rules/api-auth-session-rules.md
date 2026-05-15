# API Auth Session Rules

Rules for GitHub OAuth, session cookies, and authenticated API requests.

## Always

- Use GitHub OAuth state stored in an HTTP-only cookie before redirecting to GitHub.
- Validate callback `code`, `state`, and stored state before authenticating the GitHub user.
- Store raw session tokens only in HTTP-only cookies; store only SHA-256 token hashes in the database.
- Prefix generated session tokens with `sess_` and use `SessionsService` for hashing, lookup, creation, and revocation.
- Protect session-only private API routes with `SessionGuard` and read the authenticated user from `AuthenticatedRequest`.
- Clear the session cookie when the guard detects an invalid or expired session.

## Never

- Do not store raw session tokens, OAuth access tokens, or OAuth state values in persistent database columns.
- Do not put session tokens in local storage, query strings, or JSON responses.
- Do not trust a user ID supplied by the client for private API operations.
- Do not bypass OAuth state validation in callbacks.
- Do not add Passport or another auth abstraction unless the project intentionally changes the current direct OAuth design.
