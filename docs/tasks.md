# Tasks — Youth Fund Ledger

Work through these roughly in order. Each task should result in a working,
testable increment — avoid batching too many steps into one commit.

## Phase 0 — Project Setup
- [ ] Scaffold Next.js (App Router, TypeScript) project
- [ ] Create Supabase project, get URL + anon key + service role key
- [ ] Add `.env.local` with variables from `design.md` §9 (and `.env.example`
      without secrets, committed to git)
- [ ] Add `.gitignore` entries for `.env.local`
- [ ] Run the SQL from `design.md` §2 in the Supabase SQL editor to create
      tables and enable RLS (public `SELECT`-only policies)

## Phase 1 — Read-Only Public Ledger (no auth yet)
- [ ] `lib/supabaseClient.ts` — anon client for reads
- [ ] `GET /api/ledger?month=YYYY-MM|all` — returns members, sundays (filtered),
      contributions, settings
- [ ] `components/StatsBar.tsx` — all-time total, member count, month progress
- [ ] `components/MonthSelect.tsx` — dropdown per design §5, defaults to
      current month
- [ ] `components/LedgerTable.tsx` — renders members × filtered Sundays,
      contribution amounts as read-only "stamps," per-member "₱X of ₱Y"
      month column
- [ ] `app/page.tsx` — wires the above into the public view
- [ ] Verify: page loads with seed data, month dropdown defaults correctly,
      empty states look right with zero members/Sundays

## Phase 2 — Treasurer Auth
- [ ] `lib/auth.ts` — session cookie helpers (sign/verify JWT or equivalent)
- [ ] `POST /api/auth/set-pin` — only works while `settings.pin_hash` is null
- [ ] `POST /api/auth/login` — bcrypt compare, sets httpOnly cookie on success
- [ ] `POST /api/auth/logout` — clears cookie
- [ ] `components/PinModal.tsx` — set-pin form vs. login form depending on
      whether a PIN already exists
- [ ] Add basic rate limiting to `/api/auth/login`
- [ ] Verify: first-time PIN set works, wrong PIN rejected, session persists
      across page reload, logout clears it

## Phase 3 — Treasurer Write Actions
- [ ] `lib/supabaseAdmin.ts` — service-role client, server-only
- [ ] `POST /api/members`, `DELETE /api/members/:id` (with cascading delete
      of their contributions via FK)
- [ ] `POST /api/sundays`, `DELETE /api/sundays/:id`
- [ ] `PUT /api/contributions` — upsert `{member_id, sunday_id, amount}`
- [ ] `components/AmountEditModal.tsx` — treasurer taps a cell → modal to
      enter/edit/clear an amount
- [ ] `components/ThisWeekPanel.tsx` — quick entry list for the latest
      recorded Sunday
- [ ] Wire "Add Member," "Add Next Sunday," "Remove" (with confirm dialogs)
      into the UI, gated on session state
- [ ] Verify: all writes are rejected server-side without a valid session
      cookie (test by calling the API directly without the cookie)

## Phase 4 — Polish
- [ ] Print-friendly stylesheet (hide admin controls, clean layout)
- [ ] Mobile responsive pass (this is the primary device for most users)
- [ ] Empty/loading states for every panel
- [ ] Basic input validation (member name length, amount is a non-negative
      number, reasonable max)
- [ ] Neutral, non-shaming copy/styling for the "₱X of ₱Y" progress display
      per requirements FR-10

## Phase 5 — Deploy
- [ ] Push to GitHub
- [ ] Connect repo to Vercel, add environment variables in Vercel dashboard
- [ ] Confirm Supabase RLS policies are correctly restrictive in production
      (re-check anon key cannot write)
- [ ] Smoke test the deployed URL end-to-end (public view + treasurer flow)
- [ ] Share the live link with the youth group

## Backlog (not required for v1, from requirements.md §5)
- [ ] Multiple treasurer accounts
- [ ] CSV export
- [ ] Reminders/notifications
