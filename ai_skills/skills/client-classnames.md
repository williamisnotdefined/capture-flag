# Client Classnames

Use this skill when adding or changing conditional class names in `apps/client`.

## Rules

- Use the `classnames` package for conditional class composition.
- Import it as `cls` with `import cls from "classnames";`.
- Prefer the object form for conditional classes: `cls("base classes", { "active classes": isActive })`.
- Keep static Tailwind class sets as plain strings when there are no conditions.
- Do not add local `classNames`, `cn`, or wrapper helpers unless a concrete repeated need appears.
- Do not use template literals only to append conditional classes; use `cls` for that case.
- Keep class composition close to the component that owns the visual state.

## Example

```tsx
import cls from "classnames";

export function Card({ active }: { active: boolean }) {
  return (
    <section
      className={cls("rounded-2xl border p-4", {
        "border-orange-500 bg-orange-50": active,
        "border-stone-200 bg-white": !active,
      })}
    />
  );
}
```

## Verification

- Search changed files for local `classNames` helpers before finishing.
- Run `npm --workspace @capture-flag/client run build` after class composition changes.
