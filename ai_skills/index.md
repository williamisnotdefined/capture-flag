# AI Skills

This directory is the source of truth for AI skills used in this repository.

Canonical skills live in `ai_skills/skills`. Tool-specific folders such as `.opencode`, `.cursor`, and `.github` must only route to these canonical files. Do not duplicate skill content in tool-specific folders.

## Supported Tools

- OpenCode routes: `.opencode/skills/<skill-name>/SKILL.md`
- Cursor routes: `.cursor/rules/<skill-name>.mdc`
- GitHub Copilot routes: `.github/instructions/<skill-name>.instructions.md`

## Current Skills

- `client-react-router`: routing standards for `apps/client`
- `client-tailwind-v4`: Tailwind CSS v4 standards for `apps/client`
- `client-componentization`: component extraction rules for repeated client UI
- `react-query-request-hooks`: domain-based client API hooks for queries and mutations

## Adding A Skill

1. Create `ai_skills/skills/<skill-name>.md`.
2. Add the skill and tool metadata to `ai_skills/registry.json`.
3. Run `npm run ai-skills:sync` to generate tool-specific routes.
4. Keep all behavior and examples in the canonical skill only.

## Validation

- Run `npm run ai-skills:check` to verify all route files match `ai_skills/registry.json`.
- `npm run lint` also runs the AI skill route check before Biome.
- Route files are generated. Do not edit `.opencode`, `.cursor`, or `.github` skill routes manually.
