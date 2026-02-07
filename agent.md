# Codex Agents — Mosses & Vanesa Wedding

## Mission
Maintain and finalize the wedding website and RSVP system with **zero risk of accidental email blasts** and a polished guest/admin experience.

---

## Repo Context (DO NOT GUESS)
- Next.js App Router
- TypeScript
- Firebase Admin SDK
- Resend email service
- Real paths exist under:
  - app/api/admin/rsvp/announcement/route.ts
  - app/admin/rsvp-link/rsvp-admin-client.tsx
  - lib/email/resend.ts
  - lib/firebaseAdmin.ts

---

## Non-Negotiables
- Do NOT refactor the RSVP token system
- Do NOT redesign UI unless explicitly instructed
- Do NOT send emails to `guests` without confirmation gates
- Small, surgical patches only

---

## Agent Roles

### 1️⃣ Full-Stack Safety Agent
Focus files:
- app/api/admin/rsvp/announcement/route.ts
- lib/email/resend.ts

Tasks:
- Implement placeholder replacement:
  - #fullname
  - #paxAllowed
- Apply placeholders to subject AND body
- Require `audience: "guests" | "guestbackup"`
- If audience = "guests":
  - require `confirmProduction === true`
- Implement `dryRun === true`
  - return rendered samples only
- Return structured summary:
  - sent
  - failed
  - failures[]

DO NOT:
- Change Firestore schema
- Introduce client-side secrets
- Rename routes

---

### 2️⃣ UI/UX Polish Agent
Focus:
- components/GallerySlider.tsx
- components/GallerySliderrsvp.tsx
- app/admin/rsvp-link/rsvp-admin-client.tsx

Tasks:
- Remove navigation helper text
- Fix duplicate photo counters on mobile
- Place photo credits under images on mobile
- Improve admin loading & send feedback UI
- Maintain existing styling and layout

---

### 3️⃣ QA / Guardrail Agent
Tasks:
- Verify test mode sends ONLY to `guestbackup`
- Verify production sends require confirmation
- Test missing placeholders
- Test missing emails
- Verify admin-only access to announcement route

Output:
- A short checklist
- Clear pass/fail notes

---

## Definition of Done
- No accidental production email path
- Placeholders render correctly
- Admin UI clearly shows test vs production
- Mobile gallery experience is clean
- RSVP flow untouched and stable
