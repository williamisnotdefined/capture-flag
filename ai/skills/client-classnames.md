# Client Classnames

Use this skill when adding or changing conditional class names in `apps/client`.

## Goal

Compose conditional Tailwind class names consistently without adding local helper variants.

## Read First

- `ai/rules/client-styling-rules.md`
- `ai/examples/good-client-component.md`

## Workflow

- Keep static class sets as plain strings.
- Use `cls` only when conditional classes or caller-provided `className` need composition.
- Keep class composition close to the component that owns the visual state.
- Reuse existing primitives before creating a new class composition pattern.

## Expected Output

- `classnames` is imported as `cls`.
- No local `classNames`, `cn`, or wrapper helper is added without repeated need.
- Conditional classes use object form where possible.

## Verification

- Search changed files for local class-name helpers.
- Run `npm --workspace @capture-flag/client run build`.
