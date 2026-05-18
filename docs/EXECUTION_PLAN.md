# Initial Execution Plan - Capture Flag

The MVP must be a functional vertical slice: create a config and a flag in the client, deliver a cacheable Config JSON, and consume that flag through the SDK.

| Order | Delivery |
|---|---|
| 1 | Create TypeScript monorepo with npm workspaces |
| 2 | Bring up NestJS API with Postgres and Prisma |
| 3 | Implement OAuth with GitHub and session in an HTTP-only cookie |
| 4 | Create organizations, organization members, projects, configs, and environments |
| 5 | Create project members and per-project roles |
| 6 | Implement SDK keys per config/environment and public config endpoint |
| 7 | Create CRUD for boolean flags and per-environment values |
| 8 | Create `config_environment_states` with `revision` and `etag` |
| 9 | Generate in-house versioned Config JSON filtered by SDK key scope |
| 10 | Implement `ETag`, `Cache-Control`, and `304 Not Modified` in the public endpoint |
| 11 | Implement Remote Config JSON with `json_object` and `json_array` |
| 12 | Keep Integrations and Webhooks outside the MVP |
| 13 | Create Public Management API |

## Implemented Status

Current phase: Phase 15 - Security implemented.

| Delivery | Status |
|---|---|
| TypeScript monorepo with npm workspaces | Implemented |
| NestJS API with healthcheck | Implemented |
| PostgreSQL via Docker Compose | Implemented |
| Prisma with initial migration | Implemented |
| GitHub OAuth | Implemented in the API |
| Opaque session in HTTP-only cookie | Implemented with hash in the database |
| Organizations and organization members | Implemented |
| Projects | Implemented |
| Config `default` created with project | Implemented |
| Project members and roles | Implemented |
| Environments | Implemented |
| `config_environment_states` | Implemented for created `config + environment` pairs |
| SDK keys per `config + environment` | Implemented, raw key shown only on creation |
| Tenant isolation in private routes | Implemented in guards/access services |
| Basic operational client | Implemented |
| CRUD for feature flags and per-environment values | Implemented |
| Public config endpoint with HTTP cache | Implemented |
| Minimal audit | Implemented for flags, flag values, and SDK keys |
| Shared evaluator | Implemented in the `@capture-flag/evaluator` package and integrated into SDK JS |
| Functional SDK JS | Implemented with public Config JSON fetch, memory cache, and local evaluation |
| React SDK | Implemented with Provider and `useFeatureFlag` hook |
| SDK cache and polling | Implemented with default lazy loading, manual refresh, auto polling, offline mode, ETag, and `304 Not Modified` |
| React SDK live updates | Implemented with SDK JS subscriptions and automatic hook re-render |
| Segments | Implemented with CRUD by config, public Config JSON, and local SDK evaluation |
| Advanced Targeting | Implemented with prerequisites, array contains, date comparisons, and full SemVer in the evaluator/SDK |
| Improved Client | Implemented with flag search/filters/tags/status, per-environment values, project member management, switchers, SDK key revoke/rotate, JSON preview, and minimal timeline |
| Advanced Audit Logs | Implemented with filterable API, client timeline, automatic member/config/publish audit, and visible old/new/metadata |
| RBAC | Implemented with permission matrix by organization/project, full organization/project member management, client gates, and access tests |
| Remote Config JSON | Implemented with `json_object`, `json_array`, client/API validation, preserved public Config JSON, and evaluator/SDK support |
| Public Management API | Implemented with hash-only API tokens, scopes, rate limit, filtered OpenAPI, and documented subset of versioned routes |
| Security | Implemented with Helmet, explicit CORS, mandatory HTTPS in production, proxy support, in-memory rate limit by SDK key/IP, global IP and API token/IP, hash-only tokens/keys, and regression tests |

Next phases after Security remain outside the current implemented state.
