# Arman Hair Studio — Next.js app

One Next.js (App Router) app with two parts:

| Part | URL | Code |
|---|---|---|
| Arman Hair Studio website (converted from the React/CRA site) | `/`, `/about`, `/services`, `/gallery`, `/reviews`, `/contact`, `/login`, `/register`, `/account`, `/admin`, `/staff`, `/app` | `app/(site)`, `src/pages`, `src/components` |
| Partner Salon Network | `/network` (portals), `/network/book` (customers), `/network/admin`, `/network/partner`, `/network/expert` | `app/(network)`, `src/network` |

The two parts have separate root layouts, so the website's Tailwind styles and the network's styles never mix.

## Run locally

```bash
cd nextjs
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

## Environment variables

| Name | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Website | The existing FastAPI backend (login, appointments, reviews). Unchanged. |
| `NEXT_PUBLIC_SUPABASE_URL` | Partner Network | e.g. `https://cehdkuowqafqyahafavi.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Partner Network | Supabase → Project Settings → API → anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` | Website metadata | Optional, your final domain |

Without the two Supabase variables the Partner Network runs in **preview mode** on sample data kept in the browser, so every screen can be reviewed before the database is connected.

## Connect Supabase (Partner Network)

1. Open Supabase → SQL Editor and run `supabase/migrations/20261110000000_partner_network.sql` once. It creates the tables, row-level security, the booking functions and starter data (services, products, 4 salons, 5 experts).
2. Authentication → Users → add a user for each person who needs a portal.
3. Give each user a role (SQL Editor):

```sql
insert into public.profiles (user_id, role, full_name)  select id, 'admin',   'Arman Khan' from auth.users where email = 'owner@example.com';
insert into public.profiles (user_id, role, salon_id)   select id, 'partner', 'mantra'     from auth.users where email = 'stylemantra@example.com';
insert into public.profiles (user_id, role, expert_id)  select id, 'expert',  'rohan'      from auth.users where email = 'rohan@example.com';
```

4. Set the two `NEXT_PUBLIC_SUPABASE_*` variables on the host and redeploy.

Customers book without an account. Partners and experts only see their own salon / jobs (enforced by row-level security). Partner salons never see customer phone numbers.

## Booking rules (enforced in the app and again in the database)

- A chair is never double-booked (database exclusion constraint), with 15 min cleanup after each service.
- Wash services only go to chairs with a wash station; inactive or blocked chairs are skipped.
- Experts are offered only for services in their skills and inside their hours; 15 min gap at the same salon, 45 min when moving salons (₹150 travel allowance).
- When a customer picks a time, the chair and expert are held for 5 minutes; confirmation re-checks everything under a per-day lock.
- Each booking stores its own revenue split (salon fee, products, expert payout, travel, Arman share), so price changes never rewrite history.

## Deploy

Any Node host that supports Next.js 15 (Vercel, Netlify, Render, a VPS with `npm run build && npm start`). On Vercel set **Root Directory** to `nextjs`.

The old CRA build in `../frontend` and `../vercel-static` is untouched, so the current live site keeps working until you switch hosting to this app.

## Still to do

- Online payments (Razorpay / Stripe) — customers currently pay after the service.
- WhatsApp / SMS notifications and OTP for customer self-service.
- Move the website's own login and appointments from the FastAPI backend to Supabase, if you want a single backend.
