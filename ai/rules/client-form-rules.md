# Client Form Rules

Rules for forms in `apps/client`.

## Always

- Use `react-hook-form` for mutation forms and forms with meaningful client validation.
- Use `zod` for form schemas when a form submits data to API mutations or has reusable validation rules.
- Connect schemas with `zodResolver` from `@hookform/resolvers/zod` when using React Hook Form with Zod.
- Use `defaultValues` for every registered React Hook Form field.
- Use `noValidate` on forms so Zod owns validation messages.
- Keep schemas close to the form unless reused by multiple forms.
- Trim string values before sending them to API mutations.
- Omit optional empty string values from mutation payloads instead of sending `""`.
- Use `aria-invalid` on invalid fields.
- Display field errors next to the field that owns them.
- Use small local field wrappers such as `FormField` in complex forms when they reduce repeated label/control/error markup.
- Lightweight filter/search forms may use local state and narrow manual validation when they only update local query filters and do not submit API mutations.
- Do not ask users to type UUIDs for human UI flows; use email, search, selects, route context, or an already selected entity instead.

## Never

- Do not parse `FormData` manually in React components when React Hook Form or controlled state owns the form.
- Do not rely on browser `required` validation for app-level messages.
- Do not keep server errors in React Hook Form field state unless they map to a specific field.
- Do not duplicate parsing, schema, and payload normalization across features when a colocated helper is clearer.
- Do not send empty optional metadata fields when creating flags.
- Do not expose raw UUID entry fields in forms for organizations, projects, configs, environments, members, flags, segments, or audit filters.

## Boundaries

- React Hook Form owns field state and field validation.
- Zod owns client-side parsing and validation messages.
- React Query mutation hooks own API calls and cache invalidation.
- Server errors should remain visible from mutation state unless mapped intentionally.
- Local state may own draft/applied filter values when a form only changes query filters and the validation is small and colocated.
