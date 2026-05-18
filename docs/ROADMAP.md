# Roadmap - Capture Flag

This document describes the product evolution phases. Product context, technical decisions, config format, and data model are kept in separate documents.

| Document | Content |
|---|---|
| [`PRODUCT.md`](PRODUCT.md) | Goal, principles, terms, and multi-tenant SaaS model |
| [`TECHNICAL_DECISIONS.md`](TECHNICAL_DECISIONS.md) | Stack, finalized decisions, initial model, and future decisions |
| [`CONFIG_FORMAT.md`](CONFIG_FORMAT.md) | Public Config JSON, versioned schema, and HTTP cache |
| [`DATA_MODEL.md`](DATA_MODEL.md) | Relational model, constraints, and invariants |
| [`EXECUTION_PLAN.md`](EXECUTION_PLAN.md) | Initial MVP implementation order |

## Phase 1 - Foundation

Goal: create the minimum base to authenticate users, create organizations, members, projects, configs, project roles, environments, and SDK keys.

Status: implemented as the initial foundation in the monorepo. The UI is operational with first-party components; additional visual polish is left for later evolution.

Deliverables:

| Area | Deliverable |
|---|---|
| Monorepo | `apps/api`, `apps/client`, `packages/shared`, `packages/sdk-js`, `packages/evaluator` structure |
| API | Initial NestJS with healthcheck, config env, and PostgreSQL connection |
| Database | Initial migrations |
| Auth | Initial OAuth with GitHub and opaque sessions in an HTTP-only cookie |
| Organization | Create, list, and select organization |
| Organization Members | Support N users per organization with roles such as owner, admin, member, and viewer |
| Project | Basic project CRUD |
| Project Members | Support N users per project with roles such as project_admin, developer, and viewer |
| Config | Create configs inside a project |
| Environment | Create environments per project |
| SDK Keys | Generate public key per config/environment |
| Tenant isolation | Guards/services must validate organization, membership, and role on every private route |
| Client | Login, organization selector, project, config, and environment |

Acceptance criteria:

| Criterion |
|---|
| User can sign in through OAuth |
| Session is created with an HTTP-only cookie and token stored as a hash in the database |
| User can create an organization |
| Owner user can add organization members |
| Owner/admin user can grant project roles |
| User can create a project |
| User can create a config inside the project |
| User can create environments |
| User can copy an SDK key |
| User cannot access resources from another organization |

## Phase 2 - Feature Flags Core

Goal: allow creation and public delivery of simple flags/settings inside a config.

Status: implemented as the initial core slice, including flag CRUD, values per environment, cacheable public endpoint, and minimal audit for flags and SDK keys.

Supported types:

| Type | Use |
|---|---|
| boolean | Classic feature flag |
| string | Simple text/config |
| integer | Integer number |
| double | Decimal number |

Flag fields:

| Field | Description |
|---|---|
| config_id | Config that owns the flag |
| key | Identifier used in code |
| name | Human-readable name |
| description | Description |
| type | Value type |
| tags | Visual organization |
| hint | Usage help |
| owner | Responsible owner |
| created_at | Creation |
| updated_at | Last change |
| deleted_at | Logical deletion |

Value per environment (`feature_flag_environment_values`):

| Field | Description |
|---|---|
| project_id | Denormalization for tenant, constraints, and queries |
| config_id | Config that owns the flag |
| feature_flag_id | Flag that owns this value |
| environment_id | Environment that owns the value |
| default_value | Value served when no rule matches |
| rules_json | Targeting rules in JSONB for the MVP |
| percentage_attribute | Attribute used for percentage rollout, default `identifier` |
| percentage_options_json | Percentage rollout in JSONB for the MVP |
| updated_by_user_id | User who changed the value |

Required constraints:

| Constraint |
|---|
| `feature_flag_environment_values` must be unique by `(feature_flag_id, environment_id)` |
| `feature_flag_id`, `config_id`, and `environment_id` must belong to the same project |
| Boolean flags use `default_value` as on/off; there is no separate `enabled` field in the MVP |
| Every relevant change must increment the revision of the `config + environment` pair |

HTTP cache on the public endpoint:

| Resource | Behavior |
|---|---|
| `revision` | Integer incremented on each config change in the environment |
| `ETag` | Header derived from the revision or generated content |
| `Cache-Control` | Configurable header to allow safe SDK/CDN caching |
| `If-None-Match` | Requests without changes return `304 Not Modified` |

Minimal audit in the MVP:

| Event |
|---|
| Flag created |
| Flag metadata changed |
| Environment value changed |
| SDK key created or revoked |

Initial public endpoint:

```http
GET /public-api/v1/sdk/:sdkKey/config
```

Acceptance criteria:

| Criterion |
|---|
| Client creates flag |
| Client edits value per environment |
| Public endpoint returns valid JSON |
| Invalid SDK key returns 401 or 404 |
| SDK key only accesses the correct config and environment |
| Public Config JSON returns only flags from the SDK key config/environment |
| Public endpoint returns `ETag` and `Cache-Control` |
| Public endpoint returns `304 Not Modified` when `If-None-Match` matches |
| Changing a flag in the client increments the config/environment revision |

## Phase 3 - Evaluation Engine

Goal: create the local evaluation engine used by SDKs.

Scope: this phase is restricted to the `@capture-flag/evaluator` package. It delivers the local evaluation engine and its tests. Consuming this engine from `@capture-flag/sdk-js`, including Config JSON fetch, cache, polling, and the `getValue()` API, belongs to Phases 4 and 5.

Status: implemented in the `@capture-flag/evaluator` package, with the `evaluate()` contract, top-down rules, initial comparator matrix, basic SemVer, deterministic percentage rollout, and unit tests.

Principles:

| Principle | Description |
|---|---|
| Local evaluation | User data does not go to the API |
| Determinism | The same user receives the same result |
| Top-down | Rules evaluated in order |
| Safe fallback | Error returns the default provided by the app |
| Shared | Same package used by SDKs and tests |

User object:

```json
{
  "identifier": "123",
  "email": "user@example.com",
  "country": "BR",
  "custom": {
    "plan": "pro",
    "appVersion": "2.1.0"
  }
}
```

Initial `rules_json` format:

```json
[
  {
    "conditions": [
      {
        "attribute": "country",
        "operator": "equals",
        "value": "BR"
      }
    ],
    "serve": true
  }
]
```

Initial `percentage_options_json` format:

```json
[
  { "percentage": 20, "value": true },
  { "percentage": 80, "value": false }
]
```

The attribute used for bucketing is stored in `percentage_attribute` on the value per environment. The default is `identifier`.

Initial comparators:

| Comparator | Type |
|---|---|
| equals | string/number |
| notEquals | string/number |
| contains | string |
| startsWith | string |
| endsWith | string |
| oneOf | string/number |
| greaterThan | number |
| lessThan | number |
| semverGreaterThanOrEquals | semver |
| semverLessThan | semver |

Percentage rollout:

| Requirement | Description |
|---|---|
| Deterministic hash | Based on flag key + user attribute |
| Sticky rollout | Same user remains in the bucket |
| 0-100 | Final bucket between 0 and 99 |
| Custom attribute | Rollout can use `identifier`, `email`, or custom attr |
| Missing attribute | If the rollout attribute does not exist, evaluation falls through to the next defined fallback |

Acceptance criteria:

| Criterion |
|---|
| `evaluate()` returns the correct value without network |
| Rules are evaluated top-down |
| Rollout is deterministic |
| SemVer works for common cases |
| Tests cover the comparator matrix |

## Phase 4 - JavaScript SDK

Goal: create an SDK usable in Node, browser, and React.

Status: implemented with JS SDK fetching public Config JSON, in-memory cache, local evaluation through the evaluator, and React package with Provider/hook.

Packages:

| Package | Function |
|---|---|
| `@capture-flag/sdk-js` | Base SDK |
| `@capture-flag/react` | Provider and hooks |
| `@capture-flag/evaluator` | Shared engine |

Initial API:

```ts
const client = createClient({
  sdkKey: "sdk_xxx",
  baseUrl: "https://flags.example.com"
});

const enabled = await client.getValue("newCheckout", false, {
  identifier: "user-123",
  email: "user@example.com"
});
```

React:

```tsx
<CaptureFlagProvider client={client}>
  <App />
</CaptureFlagProvider>
```

```ts
const enabled = useFeatureFlag("newCheckout", false);
```

Acceptance criteria:

| Criterion |
|---|
| SDK fetches remote config |
| SDK evaluates flags locally |
| SDK has in-memory cache |
| React hook works |
| Node/browser work with the same core |

## Phase 5 - Polling And Cache

Goal: make the SDK resilient and efficient.

Status: implemented with default lazy loading, manual refresh, auto polling, offline mode, ETag/`304 Not Modified`, in-memory cache, and opt-in localStorage.

Decisions:

| Decision | Value |
|---|---|
| Default mode | Lazy loading |
| Polling shutdown | `client.close()` |
| React auto-update | Delivered later in Phase 5.1 |

Expected API:

```ts
const client = createClient({
  sdkKey: "sdk_xxx",
  baseUrl: "https://flags.example.com",
  mode: "lazy",
  cacheTtlMs: 60_000
});

await client.refresh();
client.close();
```

Modes:

| Mode | Behavior |
|---|---|
| Lazy loading | Default. Fetches config when there is no cache or when cache expires |
| Auto polling | Updates config on a background interval |
| Manual refresh | Uses current cache and the app calls `refresh()` to update |
| Offline mode | Uses only local cache |

Caches:

| Cache | Use |
|---|---|
| Memory cache | Default |
| localStorage | Browser, opt-in |
| Custom cache | Future |

Notes:

| Note |
|---|
| SDK must not store the raw SDK key in persistent cache |
| SDK must reuse valid cache when refresh fails |
| Invalid config must not replace existing valid cache |
| `@capture-flag/react` remains a thin layer over the JS SDK |
| In isolated Phase 5, polling only updated the SDK cache; in the current state, Phase 5.1 makes the React hook re-render through subscriptions |

Acceptance criteria:

| Criterion |
|---|
| SDK works without network using cache |
| Auto polling updates config |
| Manual refresh forces update |
| Lazy loading respects TTL |
| SDK sends `If-None-Match` when it has a cached ETag |
| SDK handles `304 Not Modified` without reprocessing config |
| `client.close()` stops background polling |

## Phase 5.1 - React SDK Live Updates

Status: implemented.

Goal: make React apps reflect config changes without depending on a new external render.

Features:

| Feature | Description |
|---|---|
| SDK subscriptions | Client exposes event or subscription for config changes |
| React live updates | `useFeatureFlag` re-renders when SDK config changes |
| Polling integration | Auto polling notifies only when the config changes |
| Cleanup | Provider and hooks remove subscriptions correctly |

Acceptance criteria:

| Criterion |
|---|
| React hook updates value after polling changes config |
| React hook continues returning fallback on initial render |
| Subscriptions do not leak after unmount |
| Evaluation Context remains local to React/SDK |

## Phase 6 - Segments

Goal: allow reusable segments in rules.

Status: implemented with segment CRUD per config, serialization in public Config JSON, local evaluation in the evaluator/SDK, and revision/ETag bump on public changes.

Implementation decisions:

| Decision | Reason |
|---|---|
| Segments scoped by config | Keeps the feature aligned with the Config JSON consumed by SDKs |
| Reference by condition `{ "segment": "key" }` | Reuses the current targeting rules structure |
| Local evaluation | Preserves Evaluation Context privacy |
| No nested segments | Avoids cycles; advanced composition is outside Phase 6 |

Examples:

| Segment | Condition |
|---|---|
| beta-users | email ends with specific domain |
| admins | custom.role equals admin |
| enterprise | custom.plan equals enterprise |
| brazil | country equals BR |

Acceptance criteria:

| Criterion |
|---|
| Client creates segments |
| Segments can be used in targeting rules |
| Segments are evaluated locally by the SDK |
| Segment changes update the Config JSON revision and ETag |

## Phase 7 - Advanced Targeting

Goal: bring targeting closer to a robust feature management system.

Status: implemented with advanced operators in the evaluator/SDK, API/client validation, and local prerequisites between flags.

Implementation decisions:

| Decision | Reason |
|---|---|
| `AND` by conditions | Already the behavior of a rule: all conditions must match |
| `OR` by ordered rules | Already the top-down behavior: the first matching rule wins |
| Prerequisite by condition | Uses `{ "prerequisiteFlag": "flag-key", "operator": "equals", "value": true }` without changing schemaVersion |
| Prerequisite restricted to `equals`/`notEquals` | Keeps dependencies predictable and typed in this phase |
| Cycles rejected in the API and safe in the evaluator | Avoids saving an invalid graph and protects SDKs from malformed config |
| SemVer 2.0.0 in the evaluator | Prerelease now respects SemVer precedence; build metadata is ignored |
| No migration | `rules_json` and `conditions_json` remain JSONB |

Features:

| Feature | Description |
|---|---|
| AND conditions | Multiple conditions in the same rule |
| OR via rules | Multiple rules in order |
| Prerequisite flags | Flag depends on another locally evaluated flag |
| Full SemVer | `semverEquals`, `semverGreaterThan`, `semverGreaterThanOrEquals`, `semverLessThan`, and `semverLessThanOrEquals` |
| Array contains | `arrayContains` for array attributes in Evaluation Context |
| Date comparisons | `dateBefore` and `dateAfter` with ISO date string or timestamp |

Acceptance criteria:

| Criterion |
|---|
| Complex rules are predictable |
| Prerequisite flags detect cycles |
| Tests cover error, missing attribute, and fallback |
| SDK does not send Evaluation Context to the API when evaluating prerequisites |
| Public Config JSON remains `schemaVersion: 1` |

## Phase 8 - Improved Client

Goal: make the product comfortable for daily use.

Status: implemented with flag search/filters, tags/status, value editing per environment, switchers, SDK key management, public config URL copy, Config JSON preview, and minimal timeline.

Screens:

| Screen | Features |
|---|---|
| Flag list | Search, filters, tags, and state |
| Flag detail | Values per environment, rules, rollout |
| Project members | Manage project members and roles |
| Config switcher | Switch between project configs |
| Environment switcher | Quick switch |
| SDK key panel | Copy key, copy public Config JSON URL, rotate and revoke key |
| JSON preview | View generated config |
| Activity timeline | Flag history |

Acceptance criteria:

| Criterion |
|---|
| User operates flags without calling the API manually |
| Search and filters work |
| User filters flags by tags |
| Preview shows the JSON delivered to the SDK |

## Phase 9 - Advanced Audit Logs

Goal: evolve the minimal MVP audit for daily use, compliance, and investigation.

Status: implemented with filterable API, timeline in the client, organization/project scope, incremental pagination, automatic audit for members/configs/publish, and visible old/new/metadata payloads.

Events:

| Event |
|---|
| Flag created |
| Flag changed |
| Environment value changed |
| Rule added/removed |
| SDK key rotated |
| Segment changed |
| Member added/changed/removed |
| Config published |

Advanced features:

| Feature |
|---|
| Timeline by flag |
| Filters by actor, entity, period, and scope |
| Pagination/load-more in the client |
| Automatic logs without mandatory user input |
| Configurable retention by future plan |
| Future export |

Acceptance criteria:

| Criterion |
|---|
| Changes continue generating immutable logs |
| Logs show actor, timestamp, old value, and new value |
| Client displays timeline |
| No audit log requires a mandatory manual field to be generated |

## Phase 10 - RBAC

Goal: control permissions by organization and project.

Status: implemented with a centralized RBAC matrix in the API, client gates for UX, full management of organization/project members, and access tests. Organization `owner` and `admin` roles can still satisfy project access without explicit membership; `member` and `viewer` need a project role to access project resources.

Organization roles:

| Role | Permissions |
|---|---|
| owner | Full access to organization, projects, members, and future billing |
| admin | Manages organization members and projects, except creating, changing, or removing owners |
| member | Can access projects where they received a role |
| viewer | Basic organization read access |

Project roles:

| Role | Permissions |
|---|---|
| project_admin | Manages project members, configs, environments, SDK keys, segments, and flags |
| developer | Creates, edits, and removes project flags |
| viewer | Read-only in the project |

Usage example:

| User | Role |
|---|---|
| Company owner | owner in the organization |
| API Lead | developer in Backend API project |
| Frontend Lead | developer in Frontend Web project |

Permissions:

| Permission | Authorized roles |
|---|---|
| create_project | organization `owner`, organization `admin` |
| read_project | organization `owner`, organization `admin`, project `project_admin`, project `developer`, project `viewer` |
| update_project | organization `owner`, organization `admin`, project `project_admin` |
| delete_project | organization `owner`, organization `admin`, project `project_admin` |
| manage_configs | organization `owner`, organization `admin`, project `project_admin` |
| create_flag | organization `owner`, organization `admin`, project `project_admin`, project `developer` |
| read_flag | organization `owner`, organization `admin`, project `project_admin`, project `developer`, project `viewer` |
| update_flag | organization `owner`, organization `admin`, project `project_admin`, project `developer` |
| delete_flag | organization `owner`, organization `admin`, project `project_admin`, project `developer` |
| manage_segments | organization `owner`, organization `admin`, project `project_admin` |
| manage_environments | organization `owner`, organization `admin`, project `project_admin` |
| manage_sdk_keys | organization `owner`, organization `admin`, project `project_admin` |
| manage_members | organization `owner`, organization `admin` for organization members, with owner reserved to owner; organization `owner`, organization `admin`, project `project_admin` for project members |
| manage_roles | organization `owner`, organization `admin` for organization roles, with owner reserved to owner; organization `owner`, organization `admin`, project `project_admin` for project roles |

Acceptance criteria:

| Criterion |
|---|
| Viewer does not edit |
| Developer does not manage users |
| Project admin manages only projects where they received that role |
| Developer edits only flags from projects where they received that role |
| Owner manages organization |
| User without a project role does not access flags for that project |

## Phase 11 - Remote Config JSON

Goal: allow arbitrary JSON values.

Status: implemented for `json_object` and `json_array`, preserving `schemaVersion: 1` and local evaluation in the SDK.

Additional types:

| Type |
|---|
| json_object |
| json_array |

Example:

```json
{
  "theme": "dark",
  "maxUpload": 10,
  "enabledModules": ["checkout", "billing"]
}
```

Acceptance criteria:

| Criterion |
|---|
| Client validates JSON |
| SDK returns object typed as unknown/generic |
| Public Config JSON preserves structure |
| Prerequisites remain restricted to primitive flags |

## Phase 12 - Integrations And Webhooks

Status: Removed from the MVP.

Post-MVP goal: notify external systems about events such as `flag.changed`, `flag.created`, `flag.archived`, `environment.changed`, `segment.changed`, and `config.published`.

This phase is not an acceptance criterion for the current MVP.

## Phase 13 - Public Management API

Goal: allow external automation.

Status: implemented with hash-only API tokens, scopes, rate limit by IP before Bearer authentication and by token/IP after authentication, OpenAPI at `/api/v1/docs`, and versioned routes. Authenticated routes are under `/api/v1`; public SDK routes are under `/public-api/v1`. `/health` remains unversioned.

Current implementation: API-token support is applied to a subset of `/api/v1` controllers. Some routes live in `ManagementApiController`; others remain in the `projects`, `configs`, `organizations`, and `segments` controllers using `AuthenticatedApiGuard`, tenant guard, and scope guard.

Endpoints:

| Endpoint | Use |
|---|---|
| `GET /api/v1/projects` | List projects |
| `POST /api/v1/projects` | Create project |
| `GET /api/v1/projects/:id/configs` | List project configs |
| `POST /api/v1/projects/:id/configs` | Create config |
| `GET /api/v1/organizations/:id/members` | List organization members |
| `POST /api/v1/organizations/:id/members` | Add existing member by `userId` or `email` |
| `PATCH /api/v1/organizations/:id/members/:memberId` | Update organization member role |
| `DELETE /api/v1/organizations/:id/members/:memberId` | Remove organization member |
| `GET /api/v1/projects/:id/members` | List project members |
| `POST /api/v1/projects/:id/members` | Grant project role |
| `GET /api/v1/flags?configId=:id` | List flags |
| `POST /api/v1/flags` | Create flag with `configId` in the body |
| `PATCH /api/v1/flags/:id` | Update flag |
| `GET /api/v1/environments?projectId=:id` | List environments |
| `GET /api/v1/configs/:id/segments` | List config segments |
| `POST /api/v1/configs/:id/segments` | Create segment in the config |
| `PATCH /api/v1/configs/:id/segments/:segmentId` | Update segment |
| `DELETE /api/v1/configs/:id/segments/:segmentId` | Remove segment |

Current scope:

| Included | Outside current scope |
|---|---|
| List/create projects | Remove projects |
| List/create configs | Remove configs |
| List/create/update flags | Remove flags via API token |
| List environments | Create/change/remove environments via API token |
| List/add/change/remove organization members and list/add project members | Change/remove project members via API token |
| List/create/change/remove segments | SDK keys and audit logs via API token |

Requirements:

| Requirement |
|---|
| API tokens |
| Scopes |
| Rate limit |
| OpenAPI |

Acceptance criteria:

| Criterion |
|---|
| Public API covers the documented MVP automation subset |
| Tokens have permissions |
| OpenAPI documentation exists |

## Phase 14 - CLI

Status: Removed from the MVP.

Post-MVP goal: operate projects, configs, flags, and config pulls from the terminal using API tokens.

This phase is not an acceptance criterion for the current MVP.

## Phase 15 - Security

Goal: harden the platform.

Status: implemented with HTTP headers through Helmet, explicit/configurable CORS, HTTPS required by default in production with proxy support, rate limit by SDK key + IP and by IP on the public endpoint, rate limit by API token + IP in the Public Management API, hash-only tokens/keys, and security regression tests. Current rate limits use process-local memory; distributed cache/rate limit is post-MVP before scaling multiple instances.

Features:

| Feature |
|---|
| HTTP security headers |
| SDK key rotation |
| Token hashing |
| Rate limit by SDK key |
| Rate limit by IP on the public endpoint |
| Rate limit by API token |
| In-memory rate limit per process in the MVP |
| Tenant validation on every query |
| Project role validation on config, flag, environment, and SDK key routes |
| Configurable CORS |
| HTTPS required in production |
| Secrets outside the database in plain text when necessary |

Acceptance criteria:

| Criterion |
|---|
| SDK key is read-only |
| API token can be revoked |
| Queries do not leak data between organizations |
| User without the appropriate role does not change project resources |
| Revoked SDK key cannot access public config |
| Process-local rate limit is documented as a residual risk |

## Phases 16-21 - Post-MVP

Status: Removed from the MVP.

These phases remain as post-MVP backlog and do not block the current validation.

| Phase | Theme | Future scope examples |
|---|---|---|
| 16 | Enterprise | SSO/OIDC, SAML, SCIM, domain verification, audit export, custom permission groups |
| 17 | Advanced performance | Precomputed Config JSON, gzip/brotli, CDN/edge cache, download metrics, Redis/distributed rate limit |
| 18 | OpenFeature | JavaScript provider, Evaluation Context mapping, evaluation metadata |
| 19 | Mobile SDKs | React Native, Flutter, Android Kotlin, and iOS Swift |
| 20 | Complete documentation | Quickstarts, SDK reference, API reference, concepts, guides, and self-host guide |
| 21 | Billing | Plans, Stripe, usage metering, limits, and seats |
