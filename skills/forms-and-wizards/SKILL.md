---
name: forms-and-wizards
description: Multi-step wizards, validation, conditional fields, and draft persistence with react-hook-form + zod. Load for the adopter questionnaire, the cat-upload wizard, auth forms, the adoption-request form, and any admin dialog that collects input (e.g. reject-with-reason).
---

# Forms & Wizards

## Stack contract
- react-hook-form + zod + `@hookform/resolvers`. **One zod schema per form** in `lib/schemas/`, imported by BOTH the client form and its server action. Validation is never defined twice.
- Hebrew error map applied globally (see rtl-hebrew-webapp skill).

## Multi-step pattern
- ONE `useForm` instance for the whole wizard; each step is a named group of fields.
- Advance = `await trigger(stepFields)`; on failure block Next and focus the first error.
- `shouldUnregister: false` and never unmount completed steps' values — back navigation must preserve everything.
- Progress: "שלב 2 מתוך 4" + bar. Steps are clickable backwards only.
- Submit exists only on the final step; disable while `isSubmitting`; server errors render at the top with `role="alert"`.
- On step change, move focus to the step's `<h2 tabIndex={-1}>` (screen-reader orientation).

## Draft persistence
- Anonymous forms: debounce-save `getValues()` to localStorage (key = form name + schema version); on mount offer "להמשיך מאיפה שהפסקת?"; clear on success. Bump the version when the schema changes — discard stale drafts.
- Adopter questionnaire (logged-in): upsert to `adopter_profiles` on every step change — the saved answers ARE the product feature, not just a draft. Set `completed_at` only on final submit.

## Conditional fields
- `watch('has_other_pets')` → reveal the detail field; make it required-when-parent-true via zod `superRefine`.
- When a conditional field hides, clear its value (`setValue(field, undefined)`) — stale hidden values fail server validation and confuse admins reading answers.

## Server side
- The action parses input with the SAME schema: `schema.safeParse(...)`; on failure return `{ fieldErrors }` and map back with `setError`.
- Re-check auth + role in the action regardless of what the page checked.

## Gotchas
- Numeric fields: `valueAsNumber: true` or you ship strings to the DB.
- Always pass a complete `defaultValues` object — missing keys cause the uncontrolled→controlled warning and lost state.
- Checkbox groups need a `Controller`.
- File inputs are NOT RHF state — the photo uploader (image-upload-pipeline skill) runs beside the form and reports uploaded paths into a hidden field.
- iOS zooms on focus when input font-size < 16px — keep inputs ≥ 16px.
- Double-submit: disable the button on first click, not after the response.

## Done checklist
- [ ] Schema shared client + server, Hebrew errors
- [ ] Per-step `trigger`, state survives back-navigation
- [ ] Draft save / restore / clear (or DB upsert for questionnaire)
- [ ] Conditional fields clear on hide
