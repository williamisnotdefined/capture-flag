# Good Auth Session

Source: `apps/api/src/auth/auth.controller.ts` (sha256: `d5f6ce825a4722bf03b7326e670ebedabf4731d696b1f373fed17cd98a2e6ee3`)
Source: `apps/api/src/auth/sessions.service.ts` (sha256: `2a1ea531da983698944471c982d180ad70f3178deee367cb28cf61842ff0fb59`)
Source: `apps/api/src/auth/session.guard.ts` (sha256: `7343f676e701c479f984ffb45c828a1a8f38367edbf30b76b8ac61bd088ddb76`)

Why this is canonical:

- Stores OAuth state and session tokens in HTTP-only cookies.
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
