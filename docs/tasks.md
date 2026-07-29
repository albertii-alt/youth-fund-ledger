# Tasks — Youth Fund Ledger
_Revision 2 — you're picking this up mid-Phase 3. See "Phase 3 Revision" below
before continuing._

## ⚠️ Phase 3 Revision (read this first)
Requirements/design changed while you were mid-build. If Amazon Q already
built any of the old "Add Sunday" flow, here's what to rip out vs. keep:

- [ ] Run the migration SQL in `design.md` §2 (or drop/recreate tables if you
      have no real data yet worth preserving)
- [ ] Delete `/api/sundays` and `/api/sundays/:id` routes entirely
- [ ] Delete any "Add Sunday" / "Remove Sunday" UI buttons and their handlers
- [ ] Add `lib/dates.ts` with `sundaysInMonth()` per `design.md` §3
- [ ] Replace `components/MonthSelect.tsx` with `components/YearMonthPicker.tsx`
      per `design.md` §6
- [ ] Add `joined_date` to the "add member" form and to `/api/members`
- [ ] Update the "expected" calculation everywhere it's used (StatsBar,
      LedgerTable per-member column) to use the new formula in `design.md` §7
- [ ] Give Amazon Q this prompt to resume cleanly:
      > "Requirements and design changed — re-read docs/requirements.md and
      > docs/design.md (both are revision 2). Sundays are now computed, not
      > stored; the `sundays` table and its API routes are removed; members
      > have a `joined_date`. Update Phase 3 code to match, then continue."

## Phase 0 — Project Setup ✅ (already done)

## Phase 1 — Read-Only Public Ledger
- [ ] `lib/supabaseClient.ts` — anon client for reads
- [ ] `lib/dates.ts` — `sundaysInMonth(year, month)` helper
- [ ] `GET /api/ledger?year=YYYY&month=MM` and `GET /api/ledger?all=true`
- [ ] `components/StatsBar.tsx` — all-time total, member count, month progress
- [ ] `components/YearMonthPicker.tsx` — year chips + 12-month grid, defaults
      to current year/month, disables future months
- [ ] `components/LedgerTable.tsx` — members × computed Sundays for the
      selected month, "₱X of ₱Y" per-member column
- [ ] `app/page.tsx` — wires the above into the public view
- [ ] Verify: picker defaults correctly, future months are disabled, a past
      month with zero data renders as legitimately empty (not an error state)

## Phase 2 — Treasurer Auth
- [ ] `lib/auth.ts` — session cookie helpers
- [ ] `POST /api/auth/set-pin`, `POST /api/auth/login`, `POST /api/auth/logout`
- [ ] `components/PinModal.tsx`
- [ ] Basic rate limiting on `/api/auth/login`
- [ ] Verify: first-time PIN set, wrong PIN rejected, session persists,
      logout clears it

## Phase 3 — Treasurer Write Actions (revised)
- [ ] `lib/supabaseAdmin.ts` — service-role client, server-only
- [ ] `POST /api/members` (with `joined_date`), `PATCH /api/members/:id`,
      `DELETE /api/members/:id`
- [ ] `PUT /api/contributions` — upsert `{member_id, contribution_date, amount}`,
      validate the date is an actual Sunday and not in the future
- [ ] `components/AmountEditModal.tsx` — treasurer taps any cell (past or
      present) to enter/edit/clear an amount — this is how paper records get
      digitized
- [ ] `components/MemberForm.tsx` — add member with name + joined_date
      (defaults to today, editable), edit joined_date later if needed
- [ ] Wire "Add Member" / "Remove Member" into the UI, gated on session state
- [ ] Verify: all writes rejected server-side without a valid session cookie
- [ ] Verify: entering an amount for a past Sunday (e.g. 3 months ago) works
      and updates that member's historical totals correctly

## Phase 4 — Historical Data Entry
- [ ] Sit down with the physical paper records and, month by month, enter
      each member's contributions via the treasurer UI
- [ ] Double-check each member's `joined_date` is set correctly so early
      months don't show them as owing money before they were part of the group
- [ ] Spot-check totals against the paper ledger for at least two members

## Phase 5 — Polish
- [ ] Print-friendly stylesheet (hide admin controls, clean layout)
- [ ] Mobile responsive pass
- [ ] Empty/loading states for every panel, including the "month hasn't
      started yet" state for future months
- [ ] Input validation (member name length, amount is a non-negative number,
      reasonable max, contribution_date is a real Sunday)
- [ ] Neutral, non-shaming copy/styling for "₱X of ₱Y" per requirements FR-14

## Phase 6 — Deploy
- [ ] Push to GitHub, connect to Vercel, add environment variables
- [ ] Confirm Supabase RLS policies are correctly restrictive in production
- [ ] Smoke test the deployed URL end-to-end (public view + treasurer flow +
      a past month with historical data)
- [ ] Share the live link with the youth group

## Backlog (not required for v1)
- [ ] Bulk/CSV import (revisit only if historical data volume grows a lot)
- [ ] Multiple treasurer accounts
- [ ] Reminders/notifications
