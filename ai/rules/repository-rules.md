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
