# AI Knowledge Base

This directory is the source of truth for AI guidance used in this repository.

The goal is an AI knowledge base for Capture Flag, not a folder of generic prompts. Reusable project knowledge lives in `rules`, `architecture`, `glossary`, and `examples`. Task workflows live in `skills` and reference that reusable context through `ai_skills/registry.json`.

## Structure

```txt
ai_skills/
  rules/
  architecture/
  glossary/
  examples/
  skills/
  registry.schema.json
  registry.json
  index.md
```

## Folder Responsibilities

- `rules`: global and domain-specific constraints, conventions, and anti-patterns.
- `architecture`: system explanations, flows, ownership boundaries, and integration points.
- `glossary`: domain vocabulary and naming meaning.
- `examples`: small real project examples that demonstrate conventions.
- `skills`: task-oriented workflows that orchestrate the reusable context.

## Supported Tools

- OpenCode routes: `.opencode/skills/<skill-name>/SKILL.md`.
- Cursor routes: `.cursor/rules/<skill-name>.mdc`.
- GitHub Copilot routes: `.github/instructions/<skill-name>.instructions.md`.

Tool-specific folders are generated. Do not edit `.opencode`, `.cursor`, or `.github` AI route files manually.

## How Routing Works

`ai_skills/registry.json` defines each routed skill and its references.

`ai_skills/registry.schema.json` documents the registry shape for editors and mirrors the structure enforced by `npm run ai-skills:check`.

Each skill entry should include:

- `name`: tool route name.
- `description`: when the skill should be used.
- `canonicalPath`: workflow file under `ai_skills/skills`.
- `references`: `rules`, `architecture`, `glossary`, and `examples` files the skill needs.
- `routes`: generated destination files.
- `toolConfig`: Cursor and GitHub route metadata.

`npm run ai-skills:sync` compiles every canonical skill plus its references into tool-specific route files. Generated route files duplicate compiled context intentionally so tools receive the same project knowledge without manually copying content.

`project-core` is the only global skill. Cursor may use `alwaysApply: true` only for skills marked with `"global": true`; task-specific skills should stay opt-in.

## Current Skills

- `project-core`: always-on repository baseline for engineering rules, domain language, verification, and AI knowledge maintenance.
- `repository-engineering-guidelines`: repository-wide engineering standards, workspace commands, AI knowledge maintenance, and final verification.
- `vitest-testing-guidelines`: Vitest test workflows for API, client, and packages.
- `client-react-router`: routing standards for `apps/client`.
- `client-tailwind-v4`: Tailwind CSS v4 styling workflow for `apps/client`.
- `client-classnames`: `classnames` package usage for conditional client classes.
- `client-componentization`: component extraction and UI ownership workflow.
- `client-state-management`: React Query, local state, immutable context values, router state, and Zustand ownership workflow.
- `react-query-request-hooks`: domain-based client API query and mutation hook workflow.
- `client-form-validation`: React Hook Form, Zod, and resolver workflow for client forms.
- `api-validation`: Nest controller, route param, and DTO validation workflow.
- `api-auth-session`: GitHub OAuth, HTTP-only sessions, session guard, logout, and authenticated identity workflow.
- `api-tenant-access`: tenant isolation, access checks, and role-gated API service workflow.
- `prisma-data-model`: Prisma schema, migration, constraint, and data model invariant workflow.
- `sdk-key-management`: SDK key generation, hashing, display, revocation, public lookup, and audit workflow.
- `config-state-audit`: config environment state, revision, ETag, public config invalidation, and audit workflow.
- `feature-flag-domain`: feature flag type, environment value, and revision semantics workflow.
- `api-public-config-contract`: public SDK config JSON, ETag, cache, and SDK key contract workflow.
- `sdk-evaluator-contract`: SDK and evaluator fallback, local evaluation, and config consumption workflow.
- `react-sdk-contract`: React provider/hook contract around the JavaScript SDK.

## Adding Knowledge

Choose the narrowest reusable location first:

- Add a `rules/*` file for durable constraints and anti-patterns.
- Add an `architecture/*` file for flows, ownership, lifecycle, or system boundaries.
- Add a `glossary/*` file for domain terms or naming meaning.
- Add an `examples/*` file for a focused real project pattern.
- Add or change a `skills/*` file only for task workflow.

Every example must include:

- `Source: ` with a real project file path and SHA-256 hash.
- `Why this is canonical:` explaining the project convention it demonstrates.

## Adding A Skill

1. Create `ai_skills/skills/<skill-name>.md`.
2. Keep the skill small: goal, read-first references, workflow, expected output, verification.
3. Add the skill to `ai_skills/registry.json`.
4. Add all reusable context files to the skill's `references` array.
5. Run `npm run ai-skills:sync`.
6. Run `npm run ai-skills:check`.

## Validation

- `npm run ai-skills:check` verifies canonical skill files, referenced context files, generated route content, and orphan generated route files.
- It also verifies route collisions, canonical skill registration, `Read First`/registry reference parity, example source paths and hashes, and compiled route size reporting.
- `npm run ai-skills:sync` writes generated routes and removes orphan generated routes.
- `npm run lint` runs `ai-skills:check` before Biome.

## Source Docs Alignment

- Changes to `docs/PRODUCT.md` should trigger a review of glossary and domain rules.
- Changes to `docs/DATA_MODEL.md` should trigger a review of `architecture/data-model.md` and Prisma rules.
- Changes to `docs/CONFIG_FORMAT.md` should trigger a review of public config, SDK, and evaluator rules.
- Changes to `docs/TECHNICAL_DECISIONS.md` should trigger a review of monorepo, API, client, and repository rules.

## Anti-Patterns

- Do not teach generic React, TypeScript, or programming advice in skills.
- Do not duplicate architecture explanations across skills.
- Do not duplicate global rules across skills.
- Do not create generated route content by hand.
- Do not add a new skill when a reusable rule, architecture doc, glossary entry, or example would better solve the context gap.
