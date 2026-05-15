---
applyTo: "apps/api/src/auth/**/*.ts,apps/api/src/common/authenticated-request.ts"
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../ai/skills/api-auth-session.md`.

Referenced context:
- `../../ai/rules/api-auth-session-rules.md`
- `../../ai/architecture/auth-session-flow.md`
- `../../ai/examples/good-auth-session.md`
- `../../ai/architecture/api-app.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: api-auth-session

## Canonical Skill: `ai/skills/api-auth-session.md`

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

# Referenced Context

## Reference: `ai/rules/api-auth-session-rules.md`

# API Auth Session Rules

Rules for GitHub OAuth, session cookies, and authenticated API requests.

## Always

- Use GitHub OAuth state stored in an HTTP-only cookie before redirecting to GitHub.
- Validate callback `code`, `state`, and stored state before authenticating the GitHub user.
- Store raw session tokens only in HTTP-only cookies; store only SHA-256 token hashes in the database.
- Prefix generated session tokens with `sess_` and use `SessionsService` for hashing, lookup, creation, and revocation.
- Protect private API routes with `SessionGuard` and read the authenticated user from `AuthenticatedRequest`.
- Clear the session cookie when the guard detects an invalid or expired session.

## Never

- Do not store raw session tokens, OAuth access tokens, or OAuth state values in persistent database columns.
- Do not put session tokens in local storage, query strings, or JSON responses.
- Do not trust a user ID supplied by the client for private API operations.
- Do not bypass OAuth state validation in callbacks.
- Do not add Passport or another auth abstraction unless the project intentionally changes the current direct OAuth design.

## Reference: `ai/architecture/auth-session-flow.md`

# Auth Session Flow Architecture

GitHub OAuth creates platform users and HTTP-only sessions for private API access.

## OAuth Start

1. `AuthController.startGithub` asks `GithubAuthService` to create an OAuth state.
2. The state is stored in the `cf_oauth_state` HTTP-only cookie.
3. The user is redirected to GitHub with `read:user user:email` scope.

## OAuth Callback

1. `AuthController.githubCallback` reads `code`, callback `state`, and the stored state cookie.
2. Missing or mismatched callback data raises `UnauthorizedException`.
3. `GithubAuthService.authenticate` exchanges the code, fetches GitHub user data, fetches primary verified email when available, and upserts the local user/OAuth account.
4. `SessionsService.createSession` creates a raw `sess_` token, stores only its hash, and returns cookie metadata.
5. The API clears the OAuth state cookie, sets the session cookie, and redirects to the client app.

## Private API Requests

- `SessionGuard` reads the session cookie, finds a non-revoked unexpired session by token hash, and attaches `request.user`.
- Invalid sessions clear the cookie and return unauthorized.
- Controllers should pass `request.user.id` to services; services own tenant and role checks.

## Logout

Logout revokes the hashed token through `SessionsService.revokeToken` and clears the session cookie.

## Reference: `ai/examples/good-auth-session.md`

# Good Auth Session

Source: `apps/api/src/auth/auth.controller.ts` (sha256: `1913259545803bcb322df4f87edce9f2581d727bd96bcae49f5fc727c276b4fc`)
Source: `apps/api/src/auth/sessions.service.ts` (sha256: `8aad3f868665d41b58f51848a10bcbeaf04c5198791a7fd20a65a42cc30d363c`)
Source: `apps/api/src/auth/session.guard.ts` (sha256: `6427751e1fae36d7e967b38d735a58d6aab154b30d0a1620f590c4c8fcef42c7`)

Why this is canonical:

- Stores OAuth state and session tokens in HTTP-only cookies.
- Uses strict SameSite session cookies by default, with env override for cross-site deploys.
- Persists only SHA-256 hashes for session lookup.
- Uses `SessionGuard` to attach authenticated user data to private requests.

## Session Creation

```ts
const token = `sess_${randomBytes(32).toString("base64url")}`;
const tokenHash = this.hashToken(token);

await this.prisma.session.create({
  data: {
    userId,
    tokenHash,
    expiresAt,
  },
});
```

The raw token is returned for the cookie only; the database stores the hash.

## Guard Pattern

```ts
const token = request.cookies?.[this.sessions.cookieName];
const session = await this.sessions.findActiveSessionByToken(token);

request.user = {
  id: session.user.id,
  name: session.user.name,
  email: session.user.email,
  avatarUrl: session.user.avatarUrl,
  sessionId: session.id,
};
```

Private controllers use `request.user.id`; services then enforce tenant access.

## Reference: `ai/architecture/api-app.md`

# API App Architecture

`apps/api` is a NestJS API backed by Prisma and PostgreSQL.

## Request Flow

- Controllers define routes, parse params, receive DTOs, and pass `request.user.id` to services.
- Private controllers use `SessionGuard` and `AuthenticatedRequest`.
- DTO classes validate and normalize request bodies.
- UUID route params use `ParseUUIDPipe` in controllers.
- Services own authorization, existence checks, ownership checks, business rules, and Prisma calls.

## Persistence

- Prisma schema and migrations define the data model.
- Prisma access is injected through `PrismaService`.
- Tenant checks usually resolve parent entities before child reads or writes.
- Constraint and uniqueness errors are mapped through the shared Prisma exception filter.

## Public SDK Boundary

- Public SDK config routes are unauthenticated by session.
- SDK keys authenticate public config access through hashed key lookup.
- SDK evaluation context never reaches the API.
- Public config output is a versioned SDK contract, not an internal API DTO.
