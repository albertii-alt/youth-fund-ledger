# Design — Youth Fund Ledger

## 1. Stack
- **Frontend/Backend**: Next.js (App Router), React, TypeScript
- **Hosting**: Vercel (free tier) — Next.js API routes run as Vercel serverless
  functions, so no separate backend server is needed
- **Database**: Supabase (free-tier hosted Postgres)
- **Styling**: Plain CSS or Tailwind (either is fine — pick based on what's
  fastest for you/Amazon Q to iterate with; examples below assume plain CSS
  modules to keep the ledger/passbook visual style from the earlier prototype)
- **Auth**: Custom PIN flow (see §4), no third-party auth provider needed

## 2. Data Model (Postgres / Supabase)

```sql
-- Single-row settings table (church name, expected weekly amount, hashed PIN)
create table settings (
  id int primary key default 1,
  church_name text not null default 'Youth Ministry',
  expected_weekly_amount numeric(10,2) not null default 20,
  pin_hash text,               -- null until treasurer sets it the first time
  constraint single_row check (id = 1)
);

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table sundays (
  id uuid primary key default gen_random_uuid(),
  the_date date not null unique,   -- e.g. 2026-08-02
  created_at timestamptz not null default now()
);

create table contributions (
  member_id uuid not null references members(id) on delete cascade,
  sunday_id uuid not null references sundays(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (member_id, sunday_id)
);
```

Notes:
- `contributions` has no row until an amount is actually entered — treat
  "no row" the same as ₱0 (not yet paid) in the UI.
- `amount` is a plain positive number; there is no fixed weekly rate enforced
  at the DB level (flexibility is core to FR-1).
- Row Level Security (RLS): enable RLS on all tables. Public (anon) role gets
  `SELECT` only. Writes only happen through server-side API routes using the
  Supabase **service role key** (never exposed to the browser).

## 3. API Routes (Next.js `/app/api/...`)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/ledger` | GET | public | Returns members, sundays, contributions, settings (for a given month or "all") |
| `/api/auth/set-pin` | POST | public (only works if no PIN set yet) | First-time PIN setup |
| `/api/auth/login` | POST | public | Verify PIN, issue session cookie |
| `/api/auth/logout` | POST | session | Clear session cookie |
| `/api/members` | POST | session | Add member |
| `/api/members/:id` | DELETE | session | Remove member |
| `/api/sundays` | POST | session | Add next Sunday |
| `/api/sundays/:id` | DELETE | session | Remove a Sunday |
| `/api/contributions` | PUT | session | Upsert `{ member_id, sunday_id, amount }` |

All session-protected routes check an httpOnly cookie (see §4) server-side
before touching the database with the service role key.

## 4. Auth Flow (PIN)
1. Treasurer clicks "Treasurer Login."
2. Client checks `settings.pin_hash`:
   - If null → show "Set PIN" form → `POST /api/auth/set-pin` hashes
     (bcrypt, cost 10+) and stores it.
   - If set → show "Enter PIN" form → `POST /api/auth/login` compares
     bcrypt hash.
3. On success, server sets an httpOnly, `Secure`, `SameSite=Lax` cookie
   containing a signed session token (e.g. via `jose`/JWT or a simple
   random token stored in a `sessions` table with an expiry — either is
   fine given the low stakes; a signed JWT avoids needing a sessions table).
4. Session expires after a reasonable window (e.g. 8 hours) so a shared
   device doesn't stay unlocked indefinitely.
5. "Lock" button clears the cookie client-side and calls `/api/auth/logout`.

## 5. Month Filtering Logic (client or API param)
- Group `sundays` by `to_char(the_date, 'YYYY-MM')`.
- Dropdown options = distinct months present in `sundays`, plus the current
  month (even if it has zero Sundays yet), sorted ascending, defaulting to
  the current month. Include an "All time" option.
- For the selected month:
  - `expected_total_per_member = (# sundays in that month) × expected_weekly_amount`
  - `actual_total_per_member = sum(contributions.amount)` for that member
    within that month's sundays
  - Progress label: `₱{actual} of ₱{expected}`

## 6. Frontend Structure (suggested)

```
/app
  /page.tsx                 -- public ledger view (default landing page)
  /api/...                  -- routes from §3
/components
  Header.tsx
  StatsBar.tsx
  MonthSelect.tsx
  ThisWeekPanel.tsx          -- treasurer-only quick entry for latest Sunday
  LedgerTable.tsx            -- month-filtered table with editable cells
  AmountEditModal.tsx        -- modal for entering a contribution amount
  PinModal.tsx                -- set-pin / login modal
/lib
  supabaseClient.ts           -- public (anon key) client for reads
  supabaseAdmin.ts            -- service-role client, server-only
  auth.ts                      -- session cookie helpers
```

## 7. Visual Style (carried over from prototype, for consistency)
- Ledger/passbook aesthetic: warm paper background, ruled-paper lines,
  serif display font (e.g. Fraunces) for headings, monospace (e.g. Space
  Mono) for numbers/dates.
- "Stamp" visual for a recorded contribution amount (pill-shaped, brass
  color), dashed empty circle for not-yet-paid.
- Keep admin controls visually distinct (brass accent) from public/read-only
  chrome (pine green).

## 8. Security Notes
- Never expose the Supabase service role key to the client — only use it
  inside API routes (server-side).
- Public/anon Supabase key only ever has read (`SELECT`) access via RLS.
- Rate-limit `/api/auth/login` (e.g. simple in-memory or Vercel KV counter)
  to slow down PIN brute-forcing.
- Sanitize member names on input (basic length limit, strip HTML) before
  storage/display.

## 9. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, never prefixed with NEXT_PUBLIC_
SESSION_SECRET=                 # for signing the JWT/session cookie
```
