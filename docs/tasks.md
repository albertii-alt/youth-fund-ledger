# Tasks — Youth Fund Ledger
_Revision 6 — you're picking this up live in production, post member
archive/profile feature. See "Post-Deploy Revision 3" below before
continuing. (Older revision notes kept below for history/reference.)_

## ⚠️ Post-Deploy Revision 3 (read this first — you are here)
See `requirements.md` §3.8 and `design.md` §8a. No database migration this
time — this feature is entirely client-side, connecting straight to
Supabase Realtime.

- [ ] Confirm Realtime is enabled on the Supabase project (check the
      dashboard — on by default for new projects, but verify)
- [ ] Build `components/ViewerCount.tsx` per the sketch in `design.md` §8a —
      joins a shared presence channel (e.g. `ledger-viewers`), tracks itself
      with a throwaway random key, listens for `sync` events, displays the
      live count
- [ ] Add `<ViewerCount />` to the main page (public, near the header/stats
      area — style it consistently with the existing ledger/passbook look)
- [ ] Verify: open the deployed site in two different browsers/devices at
      once — confirm the count shows 2, and closing one tab drops it back
      to 1 within a few seconds
- [ ] Verify: the count is visible without logging in as treasurer (public,
      per FR-27)
- [ ] Confirm no personal data appears anywhere in this feature — just a
      number, nothing identifying who's connected

## Post-Deploy Revision 2 (historical — kept for reference)
See `requirements.md` §10 and `design.md` §14. This is a real schema change
(additive only) plus new features — confirm the migration with yourself
before running it, since the app is live with real data.

- [ ] Run the additive migration: `alter table members add column left_date date;`
      (see `design.md` §2 — safe, no backfill needed, existing rows get `null`)
- [ ] Remove `DELETE /api/members/:id` entirely
- [ ] Add `PATCH /api/members/:id` support for `{ left_date }` — used for both
      "Mark as Left" (sets a date) and "Reactivate" (sets `null`)
- [ ] Update `expected_for_member()` wherever implemented to bound by
      `left_date` as well as `joined_date`, per `design.md` §7
- [ ] Add `is_sunday_editable_for_member()` and use it in **both** places:
      - [ ] `LedgerTable.tsx` — locked cells render as "N/A", not an empty
            editable stamp
      - [ ] `/api/contributions` PUT handler — reject the write server-side
            too, don't just rely on the UI hiding the option
- [ ] Add `is_member_active_in_month()` and use it in `LedgerTable.tsx` to
      decide which member rows appear for a given month at all
- [ ] Update "Mark as Left" UI: replace the old delete-confirmation dialog
      with a date picker (defaults to today) that calls the new PATCH route
- [ ] Add a "Reactivate" button/action for any member with a `left_date` set
- [ ] Update `StatsBar.tsx`'s "Total Members" count to exclude members whose
      `left_date` has passed
- [ ] Build `GET /api/members/:id` — returns one member's all-time total and
      month-by-month breakdown
- [ ] Build `app/members/[id]/page.tsx` (`MemberProfile.tsx`) — public,
      read-only, reuses the "Completed"/"₱X of ₱Y"/"Remaining ₱Z" display
      logic already built for the main ledger
- [ ] Build `GET /api/members/search?q=` — partial name match, returns only
      `{ id, name }` pairs (nothing else)
- [ ] Build `MemberSearch.tsx` — "Find my record" box on the main page,
      navigates to the matched member's profile page
- [ ] Verify: marking someone as left mid-month still shows them (and counts
      their expected/actual correctly) for that month, but they're gone from
      next month's table entirely
- [ ] Verify: a locked ("N/A") cell cannot be edited from the UI, and a direct
      API call to `/api/contributions` for that same (member, date) pair is
      also rejected
- [ ] Verify: reactivating a member restores them to current-month views
      without creating a duplicate or losing old history
- [ ] Verify: the name search finds a member and takes you to a working
      profile page showing correct totals

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
