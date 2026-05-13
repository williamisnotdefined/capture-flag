# Repository Engineering Guidelines

Use this skill for repository-wide code changes, refactors, bug fixes, feature work, and final verification in this monorepo.

## Principles

- Read nearby code and existing docs before changing behavior.
- Prefer the smallest correct change with the lowest surface area.
- Follow existing naming, file layout, import style, and error handling before introducing new patterns.
- Keep abstractions earned by repetition. Do not introduce framework, helper, or compatibility layers for hypothetical future needs.
- Keep domain contracts aligned with `docs/PRODUCT.md`, `docs/DATA_MODEL.md`, `docs/CONFIG_FORMAT.md`, and `docs/TECHNICAL_DECISIONS.md` when behavior changes.
- Do not edit generated AI skill route files directly. Change canonical files in `ai_skills/skills`, update `ai_skills/registry.json`, then run `npm run ai-skills:sync`.

## Monorepo Conventions

- Package manager: npm workspaces.
- Formatter/linter: Biome. Do not add ESLint or Prettier unless explicitly requested.
- TypeScript is strict. Avoid `any`; use precise types or `unknown` with validation at boundaries.
- Keep workspace-specific code inside its package unless it is intentionally shared through `packages/*`.
- Do not commit `.env`, raw secrets, OAuth tokens, raw session tokens, or raw SDK keys.

## Commands

- Root build: `npm run build`.
- Root tests: `npm run test`.
- Root lint: `npm run lint`.
- API build: `npm --workspace @capture-flag/api run build`.
- API tests: `npm --workspace @capture-flag/api run test`.
- Client build: `npm --workspace @capture-flag/client run build`.
- Client tests: `npm --workspace @capture-flag/client run test`.
- Shared package build/test: `npm --workspace @capture-flag/shared run build` and `npm --workspace @capture-flag/shared run test`.
- Evaluator package build/test: `npm --workspace @capture-flag/evaluator run build` and `npm --workspace @capture-flag/evaluator run test`.
- SDK package build/test: `npm --workspace @capture-flag/sdk-js run build` and `npm --workspace @capture-flag/sdk-js run test`.

## Before Coding

- Identify the narrowest affected workspace and domain.
- Read the closest service, controller, component, hook, test, schema, or doc pattern.
- Check whether a more specific skill applies before using broad repository guidance.
- Decide what needs tests: bug fixes need regression tests; domain changes need behavior tests; purely generated route changes need sync checks.

## After Coding

- Run targeted tests or builds for the changed workspace first.
- Run broader commands only when the change crosses package boundaries or affects shared infrastructure.
- Run `npm run lint` for repository-wide changes or before finishing broad refactors.
- Summarize changed areas, commands run, and any intentionally skipped verification.
