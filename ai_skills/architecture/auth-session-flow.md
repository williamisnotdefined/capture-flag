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
