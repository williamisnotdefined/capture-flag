# Good Auth Session

Source: `apps/api/src/auth/auth.controller.ts` (sha256: `819b1908769862880b418bbc1754c6cf3d7894243c63e8faf0bf60758198e0b1`)
Source: `apps/api/src/auth/sessions.service.ts` (sha256: `8aad3f868665d41b58f51848a10bcbeaf04c5198791a7fd20a65a42cc30d363c`)
Source: `apps/api/src/auth/session.guard.ts` (sha256: `8f1e973b87b842d633d24d4da55b85e4298f7f592dafaa51228b9adf1e131364`)

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
  sessionId: session.id,
};
```

Private controllers use `request.user.id`; services then enforce tenant access.
