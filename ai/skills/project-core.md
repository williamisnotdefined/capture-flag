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
