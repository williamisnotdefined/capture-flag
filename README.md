# capture-flag

Capture Flag is a multi-tenant SaaS platform for feature flags and remote config, inspired by products like ConfigCat, but with its own SDK and its own Config JSON.

## Current Status

The implementation covers through Phase 15 - Security in the roadmap:

| Area | Status |
|---|---|
| Monorepo | npm workspaces with `apps/api`, `apps/client`, `packages/shared`, `packages/evaluator`, `packages/sdk-js`, and `packages/react` |
| API | NestJS with healthcheck, GitHub auth, sessions, organizations, projects, configs, environments, SDK keys, feature flags, remote config JSON, segments, advanced targeting, advanced audit logs, versioned Public Management API, and security hardening |
| Database | Prisma + PostgreSQL with foundation migrations, feature flags, remote config JSON, segments, audit logs, and API tokens |
| Local infra | Docker Compose for PostgreSQL |
| Client | Vite + React with an operational flow for login, organizations, projects, members, configs, environments, SDK keys, feature flags, remote config JSON, filters, JSON preview, timeline, and segments |
| Evaluator | Local engine in `@capture-flag/evaluator` with rules, segments, primitive prerequisites, remote config JSON, advanced comparators, and deterministic percentage rollout |
| SDK JS | `@capture-flag/sdk-js` fetches public Config JSON, uses optional memory/localStorage cache, ETag, manual refresh, polling, and local evaluation |
| React SDK | `@capture-flag/react` exposes a Provider and the `useFeatureFlag` hook with live updates through SDK JS subscriptions |

The improved client is implemented with flag search/filters, `json_object`/`json_array` editing, quick switchers, Config JSON preview, SDK key management, per-flag timeline, and a filterable audit log panel. Security is implemented with HTTP headers, configurable CORS, mandatory HTTPS in production, proxy support, and in-memory rate limits for the SDK/Public Management API.

## Local Development

```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
npm run dev:api
npm run dev:client
```

Configure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env` before using GitHub login. The expected callback is `http://localhost:3000/api/v1/auth/github/callback`.

Local URLs:

| Service | URL |
|---|---|
| API | `http://localhost:3000` |
| API v1 | `http://localhost:3000/api/v1` |
| Public SDK API v1 | `http://localhost:3000/public-api/v1` |
| OpenAPI | `http://localhost:3000/api/v1/docs` |
| Client | `http://localhost:5173` |
| Storybook | `http://localhost:6006` |
| Healthcheck | `http://localhost:3000/health` |

Client Storybook:

```bash
npm run storybook
npm run storybook:build
```

When adding or changing React components in `apps/client`, create or update the corresponding story. Every public prop declared by the component must appear in `argTypes` with a control or action.

## Product Model

Main hierarchy:

```txt
Organization
  Project
    Config
      Feature Flags / Settings
    Environment
```

Core concepts:

| Concept | Description |
|---|---|
| Organization | Primary tenant, company, or team |
| Project | Product, application, or system |
| Config | Required set of flags/settings consumed by the SDK |
| Environment | Environment such as development, staging, or production |
| SDK Key | Public read-only key for a `config + environment` combination |
| Config JSON | Versioned, cacheable artifact downloaded by SDKs |

## Config Rule

Every flag belongs to a Config. Every SDK key points to one Config and one Environment.

To keep the MVP simple, when a Project is created the system must automatically create an initial Config with key `default`. The UI can hide the Config selector while there is only one Config in the Project.

## AIOS

The project AIOS lives in `ai/` and is the canonical source for rules, architecture, glossary, examples, and skills used by AI agents. Tool routes in `.opencode/skills`, `.cursor/rules`, and `.github/instructions` are generated; do not edit those files manually.

Main commands:

| Command | Usage |
|---|---|
| `npm run ai:sync` | Regenerates AI routes from `ai/registry.json` |
| `npm run ai:check` | Checks registry, references, example hashes, and generated routes |
| `npm run lint` | Runs `ai:check` and Biome |
| `npm run storybook` | Runs client Storybook at `http://localhost:6006` |
| `npm run storybook:build` | Generates the static client Storybook build |

## Documentation

| Document | Content |
|---|---|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Objective, principles, domain terms, and multi-tenant SaaS model |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Product evolution phases |
| [`docs/EXECUTION_PLAN.md`](docs/EXECUTION_PLAN.md) | Initial order for implementing the MVP |
| [`docs/MVP_VALIDATION.md`](docs/MVP_VALIDATION.md) | Phase-by-phase checklist for validating the MVP |
| [`docs/TECHNICAL_DECISIONS.md`](docs/TECHNICAL_DECISIONS.md) | Stack, finalized decisions, and future decisions |
| [`docs/CONFIG_FORMAT.md`](docs/CONFIG_FORMAT.md) | Public Config JSON and HTTP cache |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Relational model, constraints, and invariants |
| [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md) | Local setup, commands, AIOS, client routes, and current manual flow |
