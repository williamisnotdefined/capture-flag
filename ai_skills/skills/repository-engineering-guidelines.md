# Repository Engineering Guidelines

Use this skill for repository-wide code changes, refactors, bug fixes, feature work, and final verification.

## Goal

Make changes that preserve monorepo boundaries, project contracts, and the smallest-correct-change style used in this repository.

## Read First

- `ai_skills/rules/repository-rules.md`
- `ai_skills/rules/testing-rules.md`
- `ai_skills/rules/ai-skills-rules.md`
- `ai_skills/architecture/monorepo.md`
- `ai_skills/architecture/ai-skills-system.md`
- `ai_skills/glossary/domain-terms.md`

## Workflow

- Identify the narrowest affected workspace and domain.
- Read the closest existing service, controller, component, hook, test, schema, or doc pattern.
- Check whether a more specific skill applies before relying on broad repository guidance.
- Keep domain contracts aligned with `docs/PRODUCT.md`, `docs/DATA_MODEL.md`, `docs/CONFIG_FORMAT.md`, and `docs/TECHNICAL_DECISIONS.md` when behavior changes.
- Decide test scope before editing: bug fixes need regression tests, domain changes need behavior tests, and generated AI route changes need sync checks.

## Expected Output

- Code follows existing workspace layout and naming.
- Shared code moves to `packages/*` only when there is a real cross-workspace consumer.
- Verification commands match the affected workspace and are reported clearly.

## Verification

- Run targeted tests or builds for the changed workspace first.
- Run broader commands when the change crosses package boundaries or shared infrastructure.
- Run `npm run lint` for repository-wide changes or broad refactors.
