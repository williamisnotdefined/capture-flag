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
