# Design — Youth Fund Ledger
_Revision 4 — reflects auto-computed Sundays, member joined_date, and the
year/month calendar picker. See requirements.md §7 for the "why."_

## 1. Stack (unchanged)
- **Frontend/Backend**: Next.js (App Router), React, TypeScript
- **Hosting**: Vercel (free tier)
- **Database**: Supabase (free-tier hosted Postgres)
- **Auth**: Custom PIN flow, no third-party auth provider

## 2. Data Model (Postgres / Supabase)

```sql
create table settings (
  id int primary key default 1,
  church_name text not null default 'Youth Ministry',
  expected_weekly_amount numeric(10,2) not null default 20,
  pin_hash text,
  constraint single_row check (id = 1)
);

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  joined_date date not null default current_date,  -- NEW: editable by treasurer
  created_at timestamptz not null default now()
);

-- NOTE: the old `sundays` table is REMOVED. Sundays are computed in
-- application code, not stored.

create table contributions (
  member_id uuid not null references members(id) on delete cascade,
  contribution_date date not null,   -- must be a Sunday; validate in API layer
  amount numeric(10,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (member_id, contribution_date)
);
```

If you already ran the v1 schema (with a `sundays` table) as part of Phase 3:
```sql
-- Migration from v1 schema
alter table members add column joined_date date not null default current_date;
alter table contributions add column contribution_date date;
update contributions c set contribution_date = s.the_date
  from sundays s where s.id = c.sunday_id;
alter table contributions drop column sunday_id;
alter table contributions alter column contribution_date set not null;
alter table contributions add primary key (member_id, contribution_date);
drop table sundays;
```

Notes:
- No row in `contributions` for a given `(member, date)` = not yet paid (₱0),
  same as before.
- RLS: enable on all tables. Public (anon) role gets `SELECT` only. All writes
  go through server-side API routes using the Supabase service role key.

## 3. Sunday Calculation (application logic, not DB)

```ts
// Returns EVERY Sunday in a given year/month — no longer filtered by
// "has this specific Sunday happened yet." A month either has started
// (return all its Sundays) or hasn't (don't call this for it at all —
// the year/month picker already prevents selecting unstarted months).
//
// Uses todayInPHT() (see lib/dates.ts, added when fixing the timezone bug)
// so "is this month startable" is evaluated in Philippine time, not UTC.
function sundaysInMonth(year: number, month: number /* 1-12 */): Date[] {
  const today = todayInPHT();
  const isFutureMonth =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month - 1 > today.getMonth());
  if (isFutureMonth) return [];

  const result: Date[] = [];
  const d = new Date(year, month - 1, 1);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); // first Sunday of month
  while (d.getMonth() === month - 1) {
    result.push(new Date(d)); // no more `if (d <= today)` filter — include
                               // every Sunday in a started month, past or
                               // still to come
    d.setDate(d.getDate() + 7);
  }
  return result;
}
```

A month is "not started yet" when `year`/`month` is after the current
Philippine-time year/month — the year/month picker (§6) already disables
selecting such a month, so the UI should never call this for one. A **started**
month (current or past) always returns its full set of Sundays, regardless of
whether individual ones have occurred yet.

## 3a. Contribution Date Validation (server-side, replaces old `isFuture()`)

The old rule ("reject any `contribution_date` after today") is gone — it's
what used to block entering an advance payment for a Sunday later in the
current month. The new rule only blocks a date whose **month** hasn't
started, not a date later **within** the current month:

```ts
// Replaces the old day-level isFuture() check
function isInUnstartedMonth(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const today = todayInPHT();
  return (
    d.getFullYear() > today.getFullYear() ||
    (d.getFullYear() === today.getFullYear() && d.getMonth() > today.getMonth())
  );
}
```

`/api/contributions` should still validate `isSunday(contribution_date)`
(unchanged) and now `!isInUnstartedMonth(contribution_date)` instead of the
old `!isFuture(contribution_date)`.

## 4. API Routes (Next.js `/app/api/...`)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/ledger?year=YYYY&month=MM` | GET | public | Members, computed Sundays for that month, contributions, settings |
| `/api/ledger?all=true` | GET | public | Returns pre-aggregated per-member-per-month `{ year, month, actual, expected, status }` rows — NOT raw per-Sunday contributions. This is what powers the month-grid "All time" view. |
| `/api/auth/set-pin` | POST | public (only if no PIN set) | First-time PIN setup |
| `/api/auth/login` | POST | public | Verify PIN, issue session cookie |
| `/api/auth/logout` | POST | session | Clear session cookie |
| `/api/members` | POST | session | Add member `{ name, joined_date }` |
| `/api/members/:id` | PATCH | session | Edit member (e.g. fix joined_date) |
| `/api/members/:id` | DELETE | session | Remove member |
| `/api/contributions` | PUT | session | Upsert `{ member_id, contribution_date, amount }` |

**Removed from v1**: `/api/sundays` and `/api/sundays/:id` — no longer needed.

## 5. Auth Flow (unchanged from v1)
1. Treasurer clicks "Treasurer Login."
2. If `settings.pin_hash` is null → set-PIN form → bcrypt hash stored.
3. Else → PIN form → bcrypt compare → httpOnly, Secure, SameSite=Lax session
   cookie (signed JWT or equivalent) on success.
4. Session expires after ~8 hours.
5. "Lock" clears the cookie.

## 6. Month/Year Navigation (replaces the old dropdown)

- **Year selector**: a small row of buttons/chips, one per year that has at
  least one member `joined_date` or contribution, plus the current year.
- **Month grid**: 12 boxes (Jan–Dec) under the year selector.
  - Highlighted: currently selected month.
  - Disabled (grayed, not clickable): months entirely in the future.
  - Normal: past/current months, even if they have zero data yet — a past
    month with nothing recorded is a valid, real state (nobody's paid
    anything yet that month), not an error.
- Defaults to current year + current month on first load.
- An "All time" toggle/button switches to the aggregate view (FR-12): this
  replaces the per-Sunday `LedgerTable` with a per-month version — one column
  per month (across all years the group has existed) instead of one column
  per Sunday. Each cell uses `alltime_status()` from §7 ("Completed" or
  "Remaining ₱Z").

## 7. Expected/Progress Calculation

```
expected_for_member(member, year, month) =
  count(sundaysInMonth(year, month) where sunday >= member.joined_date)
  × settings.expected_weekly_amount
  // NOTE: sundaysInMonth() now returns the FULL month (§3), so this is the
  // whole month's expected amount from day one — it no longer grows week by
  // week as Sundays pass. See requirements.md FR-8 / FR-14b for the "why."

actual_for_member(member, year, month) =
  sum(contributions.amount where member_id = member.id
      and contribution_date in sundaysInMonth(year, month))
  // unaffected by this change — still just sums whatever's been entered,
  // including any advance payments for Sundays later in the month

progress_status(member, year, month):
  if actual_for_member >= expected_for_member:
    return "Completed"
  else:
    return "₱{actual_for_member} of ₱{expected_for_member}"
```

**Month view**: each member's cell in the summary column uses
`progress_status()` above.

**All-time view** (see §6): instead of one row of raw Sundays, compute
`progress_status()` for *every month* the group has existed, per member, then
render one column per month with a simplified label:

```
alltime_status(member, year, month):
  expected = expected_for_member(member, year, month)
  actual = actual_for_member(member, year, month)
  if actual >= expected:
    return "Completed"
  else:
    return "Remaining ₱{expected - actual}"
```

**Summary stats ("Collected" / "Expected Collectibles")** — these are scoped
to whatever is currently selected, not hardcoded to all-time:

```
if current view is a specific month (year, month):
  Collected = sum(actual_for_member(m, year, month) for m in members)
  Expected Collectibles = sum(expected_for_member(m, year, month) for m in members)

if current view is "All time":
  Collected = sum(actual_for_member(m, y, mo) for m in members, for every (y, mo) with data)
  Expected Collectibles = sum(expected_for_member(m, y, mo) for m in members, for every (y, mo) since m.joined_date)
```

## 8. Frontend Structure (suggested)

```
/app
  /page.tsx                 -- public ledger view (default landing page)
  /api/...                  -- routes from §4
/components
  Header.tsx
  StatsBar.tsx               -- "Collected" / "Expected Collectibles" / Members, scoped to current view
  YearMonthPicker.tsx        -- year chips + 12-month grid, plus "All time" toggle
  LedgerTable.tsx            -- month view: Sundays as columns, per-member "Completed" / "₱X of ₱Y" column
  AllTimeTable.tsx           -- NEW: all-time view, one column per month, "Completed" / "Remaining ₱Z" per member
  AmountEditModal.tsx        -- modal for entering a contribution amount (any date)
  MemberForm.tsx             -- add/edit member incl. joined_date
  PinModal.tsx               -- set-pin / login modal
/lib
  supabaseClient.ts
  supabaseAdmin.ts
  auth.ts
  dates.ts                   -- NEW: sundaysInMonth() and related helpers
```

## 9. Visual Style (unchanged)
Ledger/passbook aesthetic: warm paper background, ruled-paper lines, serif
display font (e.g. Fraunces) for headings, monospace (e.g. Space Mono) for
numbers/dates. Brass "stamp" for a recorded amount, dashed empty circle for
not-yet-paid. Admin controls visually distinct (brass) from public/read-only
chrome (pine green).

## 10. Security Notes (unchanged)
- Never expose the Supabase service role key to the client.
- Public/anon key only ever has `SELECT` access via RLS.
- Rate-limit `/api/auth/login`.
- Sanitize member names on input (length limit, strip HTML).
- Validate that `contribution_date` submitted to `/api/contributions` is
  actually a Sunday and not in the future, server-side.

## 11. Environment Variables (unchanged)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
```

## 13. Changelog (v3 → v4)
- `sundaysInMonth()` (§3) no longer filters out Sundays that haven't happened
  yet — a started month (current or past) always returns its complete list
  of Sundays.
- The old `isFuture()` day-level check on `/api/contributions` is replaced by
  `isInUnstartedMonth()` (§3a) — it only blocks dates in a month that hasn't
  started, allowing advance payments for later Sundays in the current month.
- `expected_for_member()` (§7) now counts the whole month's Sundays upfront
  instead of only ones that have occurred — this was an explicit product
  decision (Option B), not a bug; see requirements.md FR-8/FR-14b.
- Both `todayInPHT()` calls above reuse the same helper added when fixing the
  earlier UTC/timezone bug — no new timezone logic needed here.

## 12. Changelog (v2 → v3)
- Added `progress_status()` — returns "Completed" or "₱X of ₱Y" per §7.
- Added `alltime_status()` — returns "Completed" or "Remaining ₱Z" per §7,
  used by the new `AllTimeTable.tsx` component (one column per month).
- `/api/ledger?all=true` now returns pre-aggregated per-month rows instead of
  raw per-Sunday data.
- `StatsBar` — "Collected" and "Expected Collectibles" now compute from
  whatever view is currently selected (a specific month, or all-time),
  rather than always meaning the full history.
