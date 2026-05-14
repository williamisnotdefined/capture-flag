# Monorepo Architecture

Capture Flag is a TypeScript npm workspaces monorepo.

## Workspaces

- `apps/api`: NestJS API, Prisma access, authentication, tenant services, public SDK config endpoint.
- `apps/client`: Vite React app for platform UI.
- `packages/shared`: shared package boundary for reusable cross-workspace code.
- `packages/evaluator`: pure local evaluation engine.
- `packages/sdk-js`: JavaScript SDK that fetches public config and evaluates locally.
- `packages/react`: React provider and hook around the JavaScript SDK.

## Root Commands

- Build all workspaces: `npm run build`.
- Test all workspaces: `npm run test`.
- Lint repository: `npm run lint`.
- Sync AI routes: `npm run ai:sync`.
- Check AI routes: `npm run ai:check`.

## Boundaries

- API-only code stays in `apps/api`.
- Client-only code stays in `apps/client`.
- SDK and evaluator code must not import server-only packages.
- Shared code belongs in `packages/*` only when there is a real cross-workspace consumer.
- Product and contract docs in `docs/*` are part of the source of truth for behavior.
