---
name: rtl-transactional-email
description: Hebrew RTL transactional email with Resend — approval/rejection notices, request updates, contact handoff. RTL in email clients breaks in unique ways; load for ANY email template, email sending code, or "the email looks broken" bug.
---

# Hebrew RTL Transactional Email

## Setup
- Resend + `@react-email/components`. Domain verified (SPF + DKIM) before launch or everything lands in spam. From: `בית לחתול <no-reply@domain>`.
- Send only from server actions. Fire-and-log: an email failure is logged, never thrown to the user, never blocks the decision that triggered it.
- Resend free tier: 100/day, 3k/month — ample for this scale; note it in ARCHITECTURE if volume assumptions change.

## RTL that survives email clients (email CSS is 2005-era)
- `dir="rtl"` on `<html>` AND on **every** `<table>`/container — several clients ignore the html-level attribute.
- Table layout, width 600, single column. No flex, no grid, ever.
- ALL styles inline. Set `text-align: right` explicitly on paragraphs — don't trust `dir` inheritance in Outlook.
- Fonts: `'Assistant', Arial, sans-serif` — web fonts don't load in Gmail; Arial renders Hebrew acceptably. Don't fight it.
- LTR islands: phone numbers, links, codes get `<span dir="ltr">` or they scramble beside Hebrew text. This matters most in the contact-handoff email.

## Templates (one component each, in `emails/`)
1. `publisher-approved` — "אושרת! אפשר להתחיל להעלות חתולים" + CTA to the upload wizard
2. `cat-approved` — the listing is live + link
3. `cat-rejected` — admin's reason verbatim + edit link (tone: helpful, not punitive)
4. `request-received` — confirmation to the adopter
5. `request-approved` — **the important one**: sent to BOTH sides with the other's name + phone (LTR span) + next-steps sentence
6. `request-rejected` — gentle tone + admin note + "עוד חתולים מחכים" CTA back to the catalog

Tone: warm, short, exactly one CTA per email. Hebrew subject ≤ 45 chars; avoid mixing English into subjects (list-view reordering). Set preheader text explicitly. Colors/voice follow `DESIGN.md`.

## Buttons
Bulletproof pattern: a table cell with background-color + padding, not a CSS-styled `<a>` alone. Border-radius is fine (Outlook renders square — acceptable).

## Testing
Send real tests to Gmail web + Gmail mobile (dominant among Israeli users) and Outlook.com. Verify: right alignment everywhere, phone number not scrambled, button tappable, Hebrew sender name renders.

## Gotchas
- Gmail clips messages > 102KB — keep templates tiny.
- Include the plain-text part (react-email `render(..., { plainText: true })`) — deliverability.
- Hebrew anchor text on links is fine; keep the `href` itself plain ASCII.
- Emojis in subject are fine sparingly ("🎉 הבקשה אושרה!").

## Done checklist
- [ ] `dir="rtl"` on html + every table; inline styles only
- [ ] LTR spans on phones/links
- [ ] Plain-text part included
- [ ] Verified in Gmail mobile
