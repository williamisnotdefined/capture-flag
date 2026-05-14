# API Auth Session

Use this skill when changing GitHub OAuth, session cookies, `SessionGuard`, logout, or authenticated API request identity.

## Goal

Preserve the current direct GitHub OAuth flow and HTTP-only hashed session-token model.

## Read First

- `ai/rules/api-auth-session-rules.md`
- `ai/architecture/auth-session-flow.md`
- `ai/examples/good-auth-session.md`
- `ai/architecture/api-app.md`

## Workflow

- Identify whether the change touches OAuth state, GitHub user upsert, session creation, guard lookup, or logout.
- Keep raw session tokens in cookies only and hashed tokens in database lookups.
- Keep private controllers behind `SessionGuard` and pass `request.user.id` to services.
- Update tests or add coverage for invalid state, invalid session, expiration, or logout behavior when changed.

## Expected Output

- OAuth callbacks validate state before authentication.
- Invalid sessions clear the session cookie.
- No raw token or OAuth credential is persisted or logged.

## Verification

- Run `npm --workspace @capture-flag/api run test` for auth/session behavior changes.
- Run `npm --workspace @capture-flag/api run build` after controller, guard, or service changes.
