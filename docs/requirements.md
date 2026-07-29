# Requirements — Youth Fund Ledger
_Revision 2 — see "Changelog" at bottom for what changed from v1 and why._

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
- FR-3: Treasurer can enter, edit, or clear a member's amount for **any Sunday**,
  including past dates — this is how historical paper records get digitized.
- FR-4: **Sundays are calculated automatically, never manually added.** Given a
  month, the app derives every Sunday in it via date math. There is no
  "add a Sunday" step for the treasurer.
- FR-5: Only Sundays up to and including today are shown/editable. A month that
  hasn't started yet shows a "this month hasn't happened yet" state instead of
  empty rows.

### 3.2 Historical Data
- FR-6: The treasurer can navigate to any past month and enter contribution
  amounts to digitize the group's existing physical paper records.
- FR-7: Each member has a **joined date**, set by the treasurer (defaults to
  today when the member is added, but editable to backdate it to when they
  actually started contributing per the paper records).
- FR-8: A member's "expected" total for a given month only counts Sundays on
  or after their joined date — so nobody appears to owe money for weeks before
  they were part of the group.

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
- FR-15: A month-wide summary shows total collected vs. total expected
  ("Expected Collectibles") across all members for the selected month.

### 3.5 Members (Treasurer only)
- FR-16: Add a new member: name + joined date (defaults to today, editable).
- FR-17: Remove a member (with confirmation) — deletes their contribution
  history.
- FR-18: Edit a member's joined date later if it was entered incorrectly.

### 3.6 Stats (always visible)
- FR-19: **"Collected"** — total amount actually contributed, scoped to
  whatever is currently selected (a specific month, or the "All time" view).
  This is a rename of the old "All-Time Total" and now dynamically follows
  the current filter rather than always meaning the full history.
- FR-19b: **"Expected Collectibles"** — total expected amount across all
  members for the same scope as FR-19 (new stat).
- FR-20: Total number of members (always reflects current membership,
  regardless of month/view selected).
- FR-21: (superseded by FR-13 — see §3.4 for per-member progress display)

### 3.7 Reporting
- FR-22: A print-friendly view (admin controls hidden) for handing physical
  reports to church leaders.

### 3.8 Access Control
- FR-23: Public viewers can see everything in 3.3–3.7 but cannot edit anything.
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
