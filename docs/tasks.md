# Tasks — Youth Fund Ledger
_Revision 4 — you're picking this up post-deploy, live in production. See
"Post-Deploy Revision" below before continuing. (Older revision notes are
kept below for history/reference.)_

## ⚠️ Post-Deploy Revision (read this first — you are here)
Requirements/design changed again after going live. See `requirements.md` §9
and `design.md` §13 for the full "why."

- [ ] Update `sundaysInMonth()` in `lib/dates.ts` to return every Sunday in a
      started month, not just ones `<= today` — per `design.md` §3
- [ ] Replace the `isFuture()` check in `/api/contributions` with the new
      `isInUnstartedMonth()` per `design.md` §3a — this is what actually
      unblocks entering an amount for a Sunday later in the current month
- [ ] Update `expected_for_member()` (wherever it's implemented — likely
      `lib/ledger.ts` or inline in the API route) to count the full month's
      Sundays, not just elapsed ones, per `design.md` §7
- [ ] Double check `LedgerTable.tsx` renders every Sunday column returned by
      `sundaysInMonth()` — it should already do this correctly since it just
      maps over whatever the function returns; the bug was in the function
      itself, not the table rendering
- [ ] Verify: opening the current month on day 1 immediately shows all of
      that month's Sunday columns, not just one
- [ ] Verify: clicking a cell for a Sunday later this month (that hasn't
      happened yet) opens the amount editor and successfully saves
- [ ] Verify: a member's "Expected" for the current month shows the full
      month's amount immediately (e.g. ₱80 for a 4-Sunday month), not a
      number that grows as weeks pass
- [ ] Verify: entering a future Sunday's amount immediately updates
      "Collected" and the member's progress status correctly
- [ ] Confirm a genuinely future month (not yet started) is still disabled
      in the year/month picker and still rejected server-side if someone
      tries to submit a contribution for it directly

## ⚠️ Phase 5 Revision (read this first — you are here)
Requirements/design changed again. See `requirements.md` §8 and `design.md`
§12 for the full "why." Concretely:

- [ ] In `LedgerTable.tsx` (month view), replace the always-shown "₱X of ₱Y"
      per-member column with `progress_status()` from `design.md` §7 —
      "Completed" (styled positively, e.g. green/checkmark) once actual ≥
      expected, otherwise the existing "₱X of ₱Y"
- [ ] Build `components/AllTimeTable.tsx` — one column per month (not per
      Sunday), each cell using `alltime_status()`: "Completed" or
      "Remaining ₱Z"
- [ ] Update `GET /api/ledger?all=true` to return pre-aggregated
      per-member-per-month rows (`{year, month, actual, expected, status}`)
      instead of raw per-Sunday contributions — do the aggregation in the API
      route, not client-side, to keep the payload small
- [ ] Update `StatsBar.tsx`:
      - [ ] Rename "All-Time Total" → "Collected"
      - [ ] Add new "Expected Collectibles" stat
      - [ ] Both must recompute based on the currently selected view (a
            specific month vs. "All time") — verify by switching the picker
            and confirming the numbers change
- [ ] Verify: a member who has paid exactly or more than expected shows
      "Completed" in both the month view and the all-time view for that month
- [ ] Verify: switching between a specific month and "All time" updates
      "Collected" and "Expected Collectibles" correctly in both directions

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
