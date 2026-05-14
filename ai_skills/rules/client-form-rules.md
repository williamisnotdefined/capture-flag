# Client Form Rules

Rules for forms in `apps/client`.

## Always

- Use `react-hook-form` for client form state and submission.
- Use `zod` for form schemas.
- Connect schemas with `zodResolver` from `@hookform/resolvers/zod`.
- Use `defaultValues` for every registered field.
- Use `noValidate` on forms so Zod owns validation messages.
- Keep schemas close to the form unless reused by multiple forms.
- Trim string values before sending them to API mutations.
- Omit optional empty string values from mutation payloads instead of sending `""`.
- Use `aria-invalid` on invalid fields.
- Display field errors next to the field that owns them.

## Never

- Do not parse `FormData` manually in React components when the form is owned by React.
- Do not rely on browser `required` validation for app-level messages.
- Do not keep server errors in React Hook Form field state unless they map to a specific field.
- Do not duplicate parsing, schema, and payload normalization across features when a colocated helper is clearer.
- Do not send empty optional metadata fields when creating flags.

## Boundaries

- React Hook Form owns field state and field validation.
- Zod owns client-side parsing and validation messages.
- React Query mutation hooks own API calls and cache invalidation.
- Server errors should remain visible from mutation state unless mapped intentionally.
