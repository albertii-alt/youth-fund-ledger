# Requirements — Youth Fund Ledger

## 1. Overview
A transparent, public web ledger for tracking a church youth group's weekly Sunday
contributions. Anyone with the link can view every member's contribution history.
A single treasurer can log in with a PIN to record payments and manage members/weeks.

## 2. Users & Roles

### 2.1 Public Viewer (no login)
Anyone with the link. Read-only access to all contribution records.

### 2.2 Treasurer (PIN-protected)
A single admin role. Unlocked with a PIN (no username, no per-person accounts).
Can add/remove members, add/remove Sundays, and record/edit contribution amounts.

> Note: This is intentionally lightweight auth for a low-stakes youth fund, not
> bank-grade security. It prevents casual tampering, not a determined attacker.

## 3. Functional Requirements

### 3.1 Contributions
- FR-1: Each member's contribution for each Sunday is a **flexible peso amount**,
  not a fixed ₱20 — members may pay less, more, or exactly the suggested amount.
- FR-2: The suggested/expected weekly amount (default ₱20) is configurable.
- FR-3: Treasurer can enter, edit, or clear a member's amount for any recorded Sunday.
- FR-4: A Sunday only appears in the ledger once the treasurer explicitly adds it
  (the app does not auto-generate every calendar Sunday).

### 3.2 Month View
- FR-5: The ledger table is filtered to one calendar month at a time via a dropdown.
- FR-6: The dropdown defaults to **the current month** on page load.
- FR-7: The dropdown lists only months that contain at least one recorded Sunday,
  plus the current month even if empty.
- FR-8: An "All time" option shows every recorded Sunday across all months.

### 3.3 Progress / Shortfall Display
- FR-9: For the selected month, each member shows **"₱X of ₱Y"** where:
  - X = sum of that member's actual contributions in the selected month
  - Y = (number of Sundays recorded in that month so far) × (expected weekly amount)
- FR-10: This is phrased neutrally (a progress indicator), not as a red "shortfall"
  or debt warning — avoid shaming language or styling.
- FR-11: A month-wide summary shows total collected vs. total expected across all
  members for the selected month.

### 3.4 Members & Sundays (Treasurer only)
- FR-12: Add a new member (name only).
- FR-13: Remove a member (with confirmation) — deletes their contribution history.
- FR-14: Add the "next Sunday" (auto-suggests the date after the last recorded one).
- FR-15: Remove a recorded Sunday (with confirmation) — deletes all contributions
  tied to it.

### 3.5 Stats (always visible)
- FR-16: All-time total collected (across all members, all months).
- FR-17: Total number of members.
- FR-18: Current month collected vs. expected (see 3.3).

### 3.6 Reporting
- FR-19: A print-friendly view (admin controls hidden) for handing physical
  reports to church leaders.

### 3.7 Access Control
- FR-20: Public viewers can see everything in 3.2–3.6 but cannot edit anything.
- FR-21: Treasurer unlocks edit mode via PIN. First-time use lets them set the PIN.
- FR-22: Treasurer can lock (log out of) edit mode manually.

## 4. Non-Functional Requirements
- NFR-1: Must run on a free hosting tier (Vercel) with a free-tier database
  (Supabase).
- NFR-2: Must be usable on mobile phones (primary device for most youth members).
- NFR-3: Data changes must be visible to all viewers without requiring a manual
  refresh trigger from the treasurer (a page refresh to see new data is acceptable;
  real-time push updates are NOT required for v1).
- NFR-4: No personal data beyond first/last name is collected.
- NFR-5: PIN must never be stored or transmitted in plain text.

## 5. Out of Scope (v1)
- Multiple treasurers / role-based permissions
- Per-member individual login
- Payment processing / online payments (this only records that a payment was
  made in person, it does not move money)
- SMS/email notifications or reminders
- Multi-currency support
- Data export beyond print/PDF

## 6. Open Assumptions (confirm or adjust before/while building)
- Church name and youth group name are placeholders until final branding is given.
- Default expected weekly amount is ₱20, configurable by the treasurer later.
- "Month" is calendar month based on the Sunday's date, not a custom fiscal period.
