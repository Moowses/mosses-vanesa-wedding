# Mosses & Vanesa Wedding — Architecture

## Overview
A wedding website with a token-based RSVP system and an admin interface for managing guests and sending announcement emails.

The system is designed with **production safety first**, especially around bulk email sending.

---

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Firebase Firestore (Admin SDK)
- Resend (email delivery)
- Vercel (deployment)

---

## Directory Map

### Public Pages
- app/page.tsx — landing page
- app/rsvp/[token]/page.tsx — RSVP page (token-based)
- app/rsvp/[token]/rsvp-client.tsx — RSVP client logic

### Admin Pages
- app/admin/rsvp-link/page.tsx — admin interface
- app/admin/rsvp-link/rsvp-admin-client.tsx — admin UI logic
- app/admin/rsvp-link/LinkCopy.tsx — RSVP link utilities

### API Routes
#### Admin
- app/api/admin/login/route.ts — admin authentication
- app/api/admin/guest/route.ts — guest listing
- app/api/admin/rsvp/announcement/route.ts — bulk email sender
- app/api/admin/rsvp/messages/route.ts — RSVP-related messages

#### RSVP
- app/api/rsvp/verify/route.ts — token validation
- app/api/rsvp/submit/route.ts — RSVP submission

---

## Data Model (Firestore)

### guests (primary)
- fullName: string
- email: string
- role: string
- paxAllowed: number
- rsvpStatus: "pending" | "confirmed" | "declined"
- token: string
- createdAt: Timestamp
- updatedAt: Timestamp

### guestbackup (testing only)
- Identical schema to `guests`
- Used strictly for testing announcement emails

---

## Email System

### Sender
- lib/email/resend.ts

### Supported Placeholders
- #fullname → guest.fullName (fallback: "there")
- #paxAllowed → guest.paxAllowed

Applied to:
- Subject
- HTML body

### Announcement Route
`POST /api/admin/rsvp/announcement`

Responsibilities:
1. Require admin authentication
2. Require `audience` parameter:
   - "guests" or "guestbackup"
3. If audience = "guests":
   - require `confirmProduction: true`
4. Optional `dryRun: true`:
   - render first N emails without sending
5. Send emails via Resend
6. Return summary:
   - sent
   - failed
   - failures[]

---

## Safety Rules
- No default production sends
- Explicit confirmation required for real guests
- Test mode must use `guestbackup`
- All failures must be returned to the client
- Secrets are server-only

---

## Deployment
- Hosted on Vercel
- Required env vars:
  - RESEND_API_KEY
  - FIREBASE_PROJECT_ID
  - FIREBASE_CLIENT_EMAIL
  - FIREBASE_PRIVATE_KEY
