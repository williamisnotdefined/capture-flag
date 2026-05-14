---
name: "project-core"
description: "Always-on repository baseline for Capture Flag engineering, domain language, verification, and AI knowledge maintenance."
---

Generated from `ai/registry.json`. Do not edit manually.

Canonical skill: `../../../ai/skills/project-core.md`.

Referenced context:
- `../../../ai/rules/repository-rules.md`
- `../../../ai/rules/testing-rules.md`
- `../../../ai/rules/ai-rules.md`
- `../../../ai/architecture/monorepo.md`
- `../../../ai/architecture/ai-knowledge-system.md`
- `../../../ai/glossary/domain-terms.md`

This file is compiled from canonical AI knowledge files. Edit canonical files under `ai`, then run `npm run ai:sync`.

# Compiled AI Skill: project-core

## Canonical Skill: `ai/skills/project-core.md`

# Project Core

Use this skill as the always-on repository baseline for AI-assisted changes anywhere in Capture Flag.

## Goal

Keep every change aligned with the repository boundaries, domain language, verification flow, and AI knowledge maintenance rules.

## Read First

- `ai/rules/repository-rules.md`
- `ai/rules/testing-rules.md`
- `ai/rules/ai-rules.md`
- `ai/architecture/monorepo.md`
- `ai/architecture/ai-knowledge-system.md`
- `ai/glossary/domain-terms.md`

## Workflow

- Start from nearby code, tests, and source docs before changing behavior.
- Apply a narrower skill when the task touches client, API, data model, public config, SDK, evaluator, or tests.
- Keep reusable AI knowledge in `rules`, `architecture`, `glossary`, or `examples`; keep `skills` as task workflows.
- Run `npm run ai:sync` after changing canonical AI knowledge and generated routes.
- Run targeted verification first, then broader checks when the change crosses package boundaries.

## Expected Output

- Code follows existing monorepo boundaries and domain terminology.
- Generated AI route files are never edited manually.
- Final reporting names the verification that was run or explains why it was skipped.

## Verification

- Run the targeted workspace command for code changes.
- Run `npm run ai:check` after AI knowledge changes.
- Run `npm run lint` for broad repository changes.

# Referenced Context

## Reference: `ai/rules/repository-rules.md`

# Repository Rules

Global rules for changes anywhere in this monorepo.

## Always

- Read nearby code, tests, and project docs before changing behavior.
- Prefer the smallest correct change with the lowest surface area.
- Follow existing naming, file layout, import style, and error handling before introducing new patterns.
- Keep domain behavior aligned with `docs/PRODUCT.md`, `docs/DATA_MODEL.md`, `docs/CONFIG_FORMAT.md`, and `docs/TECHNICAL_DECISIONS.md`.
- Use npm workspaces commands from the repository root.
- Use Biome as the formatter/linter.
- Keep TypeScript strict: prefer precise types or `unknown` with validation at boundaries.
- Keep workspace-specific code inside its workspace unless it is intentionally shared through `packages/*`.

## Never

- Do not add ESLint, Prettier, or another formatter unless explicitly requested.
- Do not introduce framework, helper, or compatibility layers for hypothetical future needs.
- Do not commit `.env`, raw secrets, OAuth tokens, raw session tokens, or raw SDK keys.
- Do not move code across workspaces without a concrete shared-package boundary.
- Do not change generated AI route files directly. Change canonical files under `ai`, then run `npm run ai:sync`.

## Verification

- Run targeted tests or builds for the affected workspace first.
- Run broader commands only when the change crosses package boundaries or shared infrastructure.
- Run `npm run lint` for repository-wide changes or broad refactors.

## Reference: `ai/rules/testing-rules.md`

# Testing Rules

Testing rules for this Vitest-based monorepo.

## Always

- Use Vitest APIs such as `describe`, `it`, `expect`, `vi.fn`, and `vi.spyOn`.
- Add regression tests next to changed behavior when fixing bugs.
- Test observable behavior and domain invariants instead of implementation details.
- Run a targeted test first when a specific test file exists.
- Run the affected workspace test command after targeted tests pass.
- For API tests, mock Prisma and collaborators with plain objects containing only exercised `vi.fn()` methods.
- For SDK and evaluator packages, prefer pure unit tests around evaluation order, fallback behavior, type handling, and request/cache boundaries.

## Never

- Do not use Jest-only APIs or `jest.mock` patterns.
- Do not leave `.only` in tests.
- Do not introduce coverage targets unless a coverage script exists or the task explicitly asks for coverage.
- Do not assume Testing Library is available in `apps/client`; add new test dependencies only when the task justifies them.
- Do not reach for a real database in API unit tests by default.

## Verification

- API tests: `npm --workspace @capture-flag/api run test`.
- Client tests: `npm --workspace @capture-flag/client run test`.
- Shared tests: `npm --workspace @capture-flag/shared run test`.
- Evaluator tests: `npm --workspace @capture-flag/evaluator run test`.
- SDK tests: `npm --workspace @capture-flag/sdk-js run test`.
- All workspace tests: `npm run test`.

## Reference: `ai/rules/ai-rules.md`

# AI Rules

Rules for maintaining the AI knowledge base itself.

## Always

- Treat `ai` as the source of truth for AI guidance.
- Keep `rules`, `architecture`, `glossary`, and `examples` reusable across skills.
- Keep `skills` task-oriented: each skill should orchestrate references instead of duplicating them.
- Add every routed skill to `ai/registry.json`.
- Use `references` in `registry.json` for every rule, architecture, glossary, or example a skill depends on.
- Keep each skill's `## Read First` list identical to its `registry.json` `references` list.
- Add `Source: ` with SHA-256 hash and `Why this is canonical:` to every file under `ai/examples`.
- Review and update example hashes when the referenced source file changes.
- Run `npm run ai:sync` after changing canonical skills, registry entries, or referenced knowledge files.
- Run `npm run ai:check` before finishing AI knowledge changes.

## Never

- Do not edit `.opencode/skills`, `.cursor/rules`, or `.github/instructions` AI route files manually.
- Do not place long architecture explanations inside skills when they belong in `architecture`.
- Do not place reusable coding rules inside skills when they belong in `rules`.
- Do not teach generic programming knowledge; document how this project works.
- Do not create a new skill when a new reference document or example would solve the context gap.
- Do not set Cursor `alwaysApply: true` outside the explicitly global `project-core` skill.

## Route Generation

- Generated route files are compiled from the canonical skill plus its registry references.
- The generated files may duplicate compiled content, but manual edits there are still invalid.
- Orphan generated route files should be removed by `npm run ai:sync`.

## Reference: `ai/architecture/monorepo.md`

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

## Reference: `ai/architecture/ai-knowledge-system.md`

# AI Knowledge System Architecture

`ai` is the canonical AI knowledge base for the repository.

## Source Layers

- `rules`: reusable constraints, conventions, and anti-patterns.
- `architecture`: how project systems work and where new code integrates.
- `glossary`: domain vocabulary and naming meaning.
- `examples`: small real project examples that demonstrate conventions.
- `skills`: task-oriented workflows that reference the other layers.

## Registry

`ai/registry.json` defines routed skills.

`ai/registry.schema.json` documents the registry shape and the sync script enforces the same structural constraints during `npm run ai:check`.

Each skill entry contains:

- `name`: route name used by tool-specific files.
- `description`: when the skill should be used.
- `canonicalPath`: workflow file under `ai/skills`.
- `references`: reusable knowledge files compiled with the skill.
- `routes`: explicit generated destinations for each tool.
- `toolConfig`: Cursor and GitHub route metadata.

`project-core` is the global baseline skill. Other skills should remain task-specific and opt-in.

## Generated Routes

`scripts/ai/sync-routes.mjs` compiles each canonical skill and its references into tool routes:

- OpenCode: `.opencode/skills/<skill-name>/SKILL.md`.
- Cursor: `.cursor/rules/<skill-name>.mdc`.
- GitHub Copilot: `.github/instructions/<skill-name>.instructions.md`.

Generated routes must not be edited manually.

## Validation Flow

- `npm run ai:check` validates registry entries, reference files, generated route content, and orphan generated routes.
- The check also validates route collisions, canonical skill registration, `Read First` parity with registry references, example source paths and hashes, and compiled route size reporting.
- `npm run ai:sync` writes expected generated routes and removes orphan generated routes.
- `npm run lint` runs `ai:check` before Biome.

## Reference: `ai/glossary/domain-terms.md`

# Domain Terms

Core Capture Flag domain language.

## User

Authenticated platform identity. Users are global and can belong to multiple organizations.

## OAuth Account

External provider account linked to a user, such as GitHub.

## Session

Opaque client session stored in an HTTP-only cookie. The database stores only the token hash.

## Organization

Primary tenant. Organizations own projects and organization memberships.

## Organization Member

User membership and role inside an organization.

## Project

Product, application, or system inside an organization. Projects group configs, environments, SDK keys, members, flags, and segments.

## Project Member

User membership and role scoped to one project.

## Config

Named set of flags/settings consumed by SDKs as public Config JSON.

## Environment

Runtime environment such as development, staging, or production.

## Segment

Reusable targeting group scoped to a config. SDKs evaluate segment membership locally from Evaluation Context data.

## Audit Log

Minimal immutable record of important domain changes.
