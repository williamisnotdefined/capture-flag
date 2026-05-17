# Good Auth Session

Source: `apps/api/src/auth/auth.controller.ts` (sha256: `ea83131ff8f06799060caf72717892ad9d9b3c5c4bc04b4961d3b5aea5ffdb95`)
Source: `apps/api/src/auth/sessions.service.ts` (sha256: `0521de89eada4c22d2fe0ac55cb6a454dae9bde6bf6a751cd7fc1b828c393699`)
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
