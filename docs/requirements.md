# Requirements — Youth Fund Ledger
_Revision 5 — see "Changelog" at bottom for what changed from v1 and why._

## 1. Overview
A transparent, public web ledger for tracking a church youth group's weekly Sunday
contributions. Anyone with the link can view every member's contribution history,
including digitized historical records from the group's physical paper ledger.
A single treasurer can log in with a PIN to record payments and manage members.

## 2. Users & Roles

### 2.1 Public Viewer (no login)
Anyone with the link. Read-only access to all contribution records.

### 2.2 Treasurer (PIN-protected)
A single admin role, unlocked with a PIN (no username, no per-person accounts).
Can add/remove members and record/edit contribution amounts for any Sunday,
past or present.

> Note: This is intentionally lightweight auth for a low-stakes youth fund, not
> bank-grade security. It prevents casual tampering, not a determined attacker.

## 3. Functional Requirements

### 3.1 Contributions
- FR-1: Each member's contribution for each Sunday is a **flexible peso amount**
  — members may pay less, more, or exactly the suggested amount.
- FR-2: The suggested/expected weekly amount (default ₱20) is configurable.
- FR-3: Treasurer can enter, edit, or clear a member's amount for **any Sunday
  in a month that has started** — past, present, or a later Sunday still to
  come this month (e.g. entering an advance payment). This is also how
  historical paper records get digitized.
- FR-4: **Sundays are calculated automatically, never manually added.** Given a
  month, the app derives every Sunday in it via date math. There is no
  "add a Sunday" step for the treasurer.
- FR-5: **Every Sunday in a started month (current or past) is shown and
  editable from day one of that month** — not revealed progressively as each
  Sunday occurs. A month that hasn't started yet is not selectable at all
  (see §3.3) rather than shown empty.

### 3.2 Historical Data
- FR-6: The treasurer can navigate to any past month and enter contribution
  amounts to digitize the group's existing physical paper records.
- FR-7: Each member has a **joined date**, set by the treasurer (defaults to
  today when the member is added, but editable to backdate it to when they
  actually started contributing per the paper records).
- FR-8: A member's "expected" total for a given month counts **every Sunday
  in that month where `joined_date <= sunday <= left_date`** (or no upper
  bound if they haven't left) — including Sundays later in the month that
  haven't happened yet, if they're still active. This means the expected
  amount for a month is fixed from day one for an active member, not
  something that grows week by week as Sundays pass.
- FR-8b: Any Sunday **before** a member's `joined_date`, or **after** their
  `left_date`, is not counted toward expected and is not editable — it
  should display as a neutral "N/A" rather than an empty/editable cell, so
  the treasurer can't accidentally log a contribution for a period the
  member wasn't part of the group.

### 3.3 Year / Month Navigation
- FR-9: Navigation is a two-step calendar-style picker: a **year selector**,
  then a **12-box month grid** (Jan–Dec) below it.
- FR-10: Defaults to the current year and current month on page load.
- FR-11: Months that haven't happened yet (future) are visually disabled.
- FR-12: An "All time" view is available. Rather than listing every individual
  Sunday ever recorded (which becomes unwieldy after a year or two), it shows
  **one column per month**, with each member's status per month as:
  - **"Completed"** if that month's expected amount was met or exceeded
  - **"Remaining ₱Z"** if not, where Z = expected − actual for that month
  This mirrors the per-month progress logic in §3.4, just rolled up across
  every month at once instead of showing individual Sundays.

### 3.4 Progress / Shortfall Display
- FR-13: For the selected month, each member's progress is shown as:
  - **"Completed"** (with a clear, positive visual treatment — e.g. green/
    checkmark) when actual contributions ≥ expected amount for that month
  - **"₱X of ₱Y"** when actual contributions are still less than expected,
    where X = actual contributed so far, Y = expected amount for that month
- FR-14: Phrased neutrally as a progress indicator, not as a red "shortfall" or
  debt warning — avoid shaming language or styling, even in the incomplete
  state.
- FR-14b: Because "expected" now includes the whole month upfront (FR-8), a
  member typically won't show "Completed" until they've paid for every
  Sunday in the month, including ones still to come — this is expected
  behavior, not a bug. Advance/early payment is how a member reaches
  "Completed" before the month ends.
- FR-15: A month-wide summary shows total collected vs. total expected
  ("Expected Collectibles") across all members for the selected month.

### 3.5 Members (Treasurer only)
- FR-16: Add a new member: name + joined date (defaults to today, editable).
- FR-17: **"Mark as Left"** replaces the old hard-delete "Remove Member."
  Instead of deleting the member (which used to cascade-delete their
  contribution history), this sets a `left_date` (defaults to today,
  editable). **No contribution data is ever deleted by this action.**
- FR-17b: A member with a `left_date` set is treated as active for any month
  where `joined_date <= that month <= left_date`, and inactive for any month
  after. Concretely: the month they leave in still fully counts them; the
  month after, they stop appearing in current-entry views (see FR-8b).
- FR-17c: **"Reactivate"** — clears a member's `left_date`, restoring them to
  active status without losing any history. Available any time for a member
  who has left.
- FR-18: Edit a member's `joined_date` or `left_date` later if entered
  incorrectly.

### 3.6 Member Profile / Individual Record
- FR-18b: Each member has a permanent, unique, publicly viewable page (e.g.
  `/members/{id}`) showing that member's own contribution history: an
  all-time total and a month-by-month breakdown (reusing the same
  "Completed" / "₱X of ₱Y" / "Remaining ₱Z" logic from §3.4/§3.3).
- FR-18c: This page is **public/read-only**, consistent with the rest of the
  ledger's transparency — no PIN required to view it, only to edit anything.
- FR-18d: The main page includes a **"Find my record" name search** so a
  member can look themselves up and reach their own profile page without
  needing to know or be given their internal ID directly.

### 3.7 Stats (always visible)
- FR-19: **"Collected"** — total amount actually contributed, scoped to
  whatever is currently selected (a specific month, or the "All time" view).
  This is a rename of the old "All-Time Total" and now dynamically follows
  the current filter rather than always meaning the full history.
- FR-19b: **"Expected Collectibles"** — total expected amount across all
  members for the same scope as FR-19 (new stat).
- FR-20: Total number of **active** members (i.e. no `left_date`, or a
  `left_date` that hasn't passed yet) — members who have left are not
  counted here, though their historical data remains fully visible elsewhere.

### 3.8 Reporting
- FR-22: A print-friendly view (admin controls hidden) for handing physical
  reports to church leaders.

### 3.9 Access Control
- FR-23: Public viewers can see everything in 3.3–3.8 but cannot edit anything.
- FR-24: Treasurer unlocks edit mode via PIN. First-time use lets them set it.
- FR-25: Treasurer can lock (log out of) edit mode manually.

## 4. Non-Functional Requirements
- NFR-1: Must run on a free hosting tier (Vercel) with a free-tier database
  (Supabase).
- NFR-2: Must be usable on mobile phones (primary device for most youth
  members).
- NFR-3: A page refresh to see new data is acceptable; real-time push updates
  are NOT required for v1.
- NFR-4: No personal data beyond first/last name and joined date is collected.
- NFR-5: PIN must never be stored or transmitted in plain text.

## 5. Out of Scope (v1)
- Multiple treasurers / role-based permissions
- Per-member individual login
- Payment processing / online payments (this only records that a payment was
  made in person, it does not move money)
- SMS/email notifications or reminders
- Multi-currency support
- **Bulk/CSV import of historical data** — with only a few months of paper
  records, manual entry through the month picker is faster than building an
  importer. Revisit if historical volume grows significantly.
- Data export beyond print/PDF

## 6. Open Assumptions
- Church name and youth group name are placeholders until final branding is
  given.
- Default expected weekly amount is ₱20, configurable by the treasurer later.
- "Month" is calendar month based on the Sunday's date, not a custom fiscal
  period.
- Historical digitization covers "a few months" of paper records — manual
  entry is the intended workflow, not an import tool.

## 7. Changelog (v1 → v2)
- Removed manual "Add Sunday" / "Remove Sunday" concept entirely — Sundays are
  now derived by date math, not stored or manually created.
- Replaced flat month dropdown with a year selector + month grid.
- Added per-member `joined date` so historical months don't falsely show
  someone as owing money before they joined.
- Explicitly scoped in: digitizing existing physical paper records via manual
  entry into past months.
- Explicitly scoped out: bulk/CSV import (not worth it at current data volume).

## 8. Changelog (v2 → v3)
- Progress display now shows "Completed" once a member hits/exceeds their
  expected amount for the month, instead of always showing "₱X of ₱Y".
- "All time" view is no longer a giant per-Sunday table — it's one column
  per month, with each member showing "Completed" or "Remaining ₱Z".
- Renamed "All-Time Total" stat to "Collected."
- Added a new "Expected Collectibles" stat.
- Both "Collected" and "Expected Collectibles" now dynamically scope to
  whatever month/view is currently selected, not always the full history.

## 9. Changelog (v3 → v4)
- All Sundays in a started month (current or past) now show and are editable
  from day one — previously they were revealed one at a time as each Sunday's
  date passed.
- Treasurer can now enter advance/early payments for a Sunday later in the
  current month that hasn't happened yet.
- "Expected" for a month now counts the full month's Sundays upfront (on/after
  the member's joined date), not just Sundays that have occurred so far. This
  was an explicit choice — see FR-8 and FR-14b for the reasoning and the
  resulting effect on when "Completed" appears.

## 10. Changelog (v4 → v5)
- Hard-delete "Remove Member" is replaced by **"Mark as Left"** — sets a
  `left_date` instead of deleting anything. No contribution data is ever
  deleted this way. A "Reactivate" action clears `left_date` if they return.
- "Expected" is now bounded on both ends: `joined_date <= sunday <=
  left_date`. A member who leaves mid-month still gets full credit for the
  Sundays that occurred while they were active; Sundays after they left don't
  count against them and aren't editable.
- Added a public, per-member profile page (`/members/{id}`) showing that
  member's own all-time and month-by-month history.
- Added a "Find my record" name-search on the main page so members can reach
  their own profile without needing their internal ID.
- "Total Members" stat now counts only currently-active members; former
  members' data remains fully visible elsewhere, just excluded from this
  count.
