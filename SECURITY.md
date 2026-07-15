# Security and launch checklist

No internet-facing application can be guaranteed “completely secure”. This document
separates protections enforced by the repository from controls that must be enabled in
the deployment accounts before launch.

## Enforced in the repository

- Supabase RLS is the authorization boundary for every application table.
- Migrations `0008_security_hardening.sql`–`0009_storage_insert_policy_fix.sql` make cat media private. Anonymous visitors
  can obtain a short-lived signed URL only for a published cat; owners and admins can
  also access their authorized non-public listings.
- Direct PostgREST and Storage writes are constrained by role, publisher approval,
  status transitions, path format, MIME type, file size, and bounded text lengths.
- Service-role storage deletion happens only after an authorized row deletion and only
  for canonical paths belonging to that cat.
- Before persisting media, server actions confirm each referenced object exists in
  storage with an allowed stored type and bounded size. Service-role helpers
  (`getUserEmail`, `closeSiblings`) re-check admin/owner authorization themselves rather
  than trusting their callers.
- Server actions revalidate form data and identity; admin actions validate UUIDs and
  bound moderation reasons.
- HTTP responses include CSP, clickjacking, MIME-sniffing, referrer, permissions, and
  HSTS protections. The development UI returns 404 in production.
- Logout rejects cross-site mutations. Redirects reject absolute, encoded-slash,
  backslash, and control-character payloads.
- Missing production email credentials fail closed; email addresses are not written to
  logs, and mock emails are never written to disk in production.

## Required before production launch

1. Apply every Supabase migration through `0009` and run the RLS smoke test against the
   target project as anon, user, approved publisher, and admin.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, and
   `RESEND_FROM_EMAIL` in the production secret store. Never expose the service key.
3. In Supabase Auth, require email verification, set the server-side minimum password
   length to at least 8, enable leaked-password protection, use strict redirect URLs,
   and review signup/login/email rate limits.
4. Add CAPTCHA or Turnstile to signup and other abuse-prone public flows. Require MFA
   for every administrator before real adopter data is stored.
5. Enable Vercel firewall/rate-limiting rules for authentication, Server Actions, and
   `/api/media`; set spend and traffic alerts in both Vercel and Supabase.
6. Use only HTTPS on the final domain. Confirm HSTS after DNS is final, and do not set
   `NEXT_IMAGE_UNOPTIMIZED` in production.
7. Configure log retention and alerts without recording questionnaires, phone numbers,
   email addresses, tokens, or request bodies. Rotate all keys after any suspected leak.
8. Publish privacy and retention policies, define account-deletion handling, and test a
   backup restore. Adoption questionnaires and contact details are personal data.
9. Run dependency auditing in CI on every change and enable automated security updates.

## Known residual hardening (recommended, not yet implemented)

Reviewed and deliberately deferred. None is an open vulnerability in the current code.

1. CSP allows `script-src 'unsafe-inline'` (`next.config.ts`). No inline-script XSS sink
   exists today; a nonce-based policy would remove the residual but requires wiring a
   per-request nonce through the app.
2. Email subject lines embed the cat name without stripping control characters
   (`emails/*.tsx` `getSubject`). The name is length-bounded and react-email/Resend
   normalize headers, so header injection is not currently exploitable; stripping
   CR/LF from the name before building the subject would close it defensively.
3. Media validation checks existence, declared MIME, and size, but does not read the
   bytes to confirm the real format (magic number). A full check would cost storage
   egress against the free-tier target; the private bucket, allowed-MIME list, size
   limit, `nosniff`, and cross-origin delivery keep the residual risk low.

## Verification

```text
npm run gate
npm run build
npm run check:rls
npm audit --omit=dev
```

The RLS test changes local/test data temporarily and cleans it up. Never point it at a
production project without an explicit maintenance window and a verified backup.
