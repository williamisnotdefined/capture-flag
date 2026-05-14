# Client Form Validation

Use this skill when adding or changing forms in `apps/client`.

## Goal

Build forms whose field state, schema validation, payload normalization, and mutation boundaries match existing client patterns.

## Read First

- `ai/rules/client-form-rules.md`
- `ai/rules/client-component-rules.md`
- `ai/rules/client-api-hook-rules.md`
- `ai/examples/good-client-form.md`

## Workflow

- Define or update the Zod schema near the owning form unless reused.
- Use React Hook Form with `defaultValues`, `zodResolver`, and `handleSubmit`.
- Normalize optional strings before sending mutation payloads.
- Keep field errors next to fields and server errors in mutation state unless mapped intentionally.
- Reuse shared form controls that accept native props, `className`, `aria-invalid`, and `ref`.

## Expected Output

- Forms use `noValidate`.
- Browser `required` and manual `FormData` parsing do not own validation.
- Optional empty values are omitted or converted according to the API contract.
- Mutation hooks still own API calls and cache invalidation.

## Verification

- Check forms do not rely on browser validation for app messages.
- Check optional empty values are not sent as empty strings.
- Run `npm --workspace @capture-flag/client run build`.
