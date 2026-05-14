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
