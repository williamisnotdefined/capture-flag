# AI Skills

This directory is the source of truth for AI skills used in this repository.

Canonical skills live in `ai_skills/skills`. Tool-specific folders such as `.opencode`, `.cursor`, and `.github` must only route to these canonical files. Do not duplicate skill content in tool-specific folders.

## Supported Tools

- OpenCode routes: `.opencode/skills/<skill-name>/SKILL.md`
- Cursor routes: `.cursor/rules/<skill-name>.mdc`
- GitHub Copilot routes: `.github/instructions/<skill-name>.instructions.md`

## Current Skills

- `repository-engineering-guidelines`: repository-wide engineering standards, workspace commands, and verification
- `vitest-testing-guidelines`: Vitest test conventions for API, client, and packages
- `client-react-router`: routing standards for `apps/client`
- `client-tailwind-v4`: Tailwind CSS v4 standards for `apps/client`
- `client-componentization`: component extraction rules for repeated client UI
- `react-query-request-hooks`: domain-based client API hooks for queries and mutations
- `client-form-validation`: React Hook Form, Zod, and resolver standards for client forms
- `api-validation`: Nest controller, route param, and DTO validation standards for the API
- `api-tenant-access`: tenant isolation, access checks, and role-gated API service rules
- `prisma-data-model`: Prisma schema, migration, constraint, and data model invariant rules
- `feature-flag-domain`: feature flag type, environment value, and revision bump semantics
- `api-public-config-contract`: public SDK config JSON, ETag, cache, and SDK key contract rules
- `sdk-evaluator-contract`: SDK and evaluator fallback, local evaluation, and config consumption rules

## Adding A Skill

1. Create `ai_skills/skills/<skill-name>.md`.
2. Add the skill and tool metadata to `ai_skills/registry.json`.
3. Run `npm run ai-skills:sync` to generate tool-specific routes.
4. Keep all behavior and examples in the canonical skill only.

## Validation

- Run `npm run ai-skills:check` to verify all route files match `ai_skills/registry.json`.
- `npm run lint` also runs the AI skill route check before Biome.
- Route files are generated. Do not edit `.opencode`, `.cursor`, or `.github` skill routes manually.
