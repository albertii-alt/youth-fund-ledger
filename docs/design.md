# Design — Youth Fund Ledger
_Revision 2 — reflects auto-computed Sundays, member joined_date, and the
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
// Returns all Sundays in a given year/month that are <= today
function sundaysInMonth(year: number, month: number /* 1-12 */): Date[] {
  const today = new Date();
  const result: Date[] = [];
  const d = new Date(year, month - 1, 1);
  // advance to first Sunday of the month
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  while (d.getMonth() === month - 1) {
    if (d <= today) result.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return result;
}
```

A month is "not started yet" when `sundaysInMonth` returns an empty array AND
the month is in the future relative to today — the UI should distinguish this
from a past month that simply has zero contributions recorded.

## 4. API Routes (Next.js `/app/api/...`)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/ledger?year=YYYY&month=MM` | GET | public | Members, computed Sundays for that month, contributions, settings |
| `/api/ledger?all=true` | GET | public | All-time view across every month with data |
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
- An "All time" toggle/button switches to the aggregate view (FR-12).

## 7. Expected/Progress Calculation

```
expected_for_member(member, year, month) =
  count(sundaysInMonth(year, month) where sunday >= member.joined_date)
  × settings.expected_weekly_amount

actual_for_member(member, year, month) =
  sum(contributions.amount where member_id = member.id
      and contribution_date in sundaysInMonth(year, month))

progress_label = "₱{actual} of ₱{expected}"
```

Month-wide summary = sum of `actual_for_member` and `expected_for_member`
across all members for the selected month.

## 8. Frontend Structure (suggested)

```
/app
  /page.tsx                 -- public ledger view (default landing page)
  /api/...                  -- routes from §4
/components
  Header.tsx
  StatsBar.tsx
  YearMonthPicker.tsx        -- NEW: replaces MonthSelect.tsx
  LedgerTable.tsx            -- month-filtered table, computed Sundays as columns
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
