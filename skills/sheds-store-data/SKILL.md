---
name: sheds-store-data
description: Data and money in sheds.store - the Supabase project, the three Supabase clients and when to use each, RLS, the session cookies, dealership access, migrations, the dealer signup lifecycle, inventory sources, plans and Authorize.Net billing. Use when reading or writing Supabase tables, adding a migration, touching auth or sessions, dealer signup or dashboard data, inventory sync, plans, prices, subscriptions, or anything that charges a card on sheds.store.
---

# sheds.store data

Supabase (Postgres, Auth, Storage). The project details are in **`docs/agents/data.md` in your sheds.store-new clone**. The Supabase MCP server comes with the official `supabase` plugin (`/plugin install supabase@claude-plugins-official`). Scope it to the project and read-only, as `docs/agents/data.md` shows, and use it to check the live schema before assuming a column exists.

## Supabase clients

| Client | Import | Use |
| --- | --- | --- |
| `supabase` | `@supabase/index` | Anon key. Public reads only. It's shared, so never hold per-user auth state on it on the server. |
| `createAuthSupabase(token)` | `@lib/supabase/createAuthClient` | Carries the user's JWT, so RLS applies. Pass `{ readOnly: true }` for reads. The default for anything a signed-in dealer does. |
| `createAdminSupabase()` | `@lib/supabase/createAdminClient` | Service role. Server-to-server and cron writes only. It falls back to anon when the key is missing, so check `serviceRole` before trusting a write. |

Never import the admin client into anything that ships to the browser. Server-only code lives in `src/lib/server/`.

## Sessions

Four cookies: `sbat` (access token), `sbrt` (refresh token), `dealerid` (active dealership), `step` (signup step). Every subdomain shares them. Read `docs/agents/data.md` before changing their attributes or adding a cookie: it explains the security trade-off.

- `resolveServerSession()` (`src/lib/server/session.ts`) validates `sbat` and refreshes from `sbrt`. Append its `setCookies` to your response, or the refresh is lost.
- `getDashboardDealershipContext()` (`src/lib/server/dealershipContext.ts`) resolves which dealerships a user can manage: the `dealership_users` link table, falling back to `dealerships.dealership_email`. A user can own several lots; `dealerid` picks the active one.

## Migrations

Plain SQL in `supabase/migrations/`, named `YYYYMMDDHHMMSS_description.sql`. The folder isn't the full schema: base tables predate the first migration (2026-03). So:

1. Check the live schema first (Supabase MCP `list_tables`, or the dashboard).
2. Write an additive, idempotent migration (`create table if not exists`, `add column if not exists`).
3. Add RLS policies in the same migration for any new table that a dealer reads or writes.
4. Don't apply it to production from an agent. Put it in the MR; a maintainer applies it.

## Dealer lifecycle

- Signup is a multi-step wizard (`src/pages/auth/signup/`, copy in `src/lib/constants/signupSteps.ts`). Progress is `dealerships.signup_process`. The dashboard renders only when it's `7`.
- `subscriptionRequired()` (`src/lib/server/billing/subscriptionGate.ts`) sends a dealer with nothing billing them to `/auth/subscribe`.
- The dashboard is one Astro page hosting `src/components/vue/dashboard/dashboard_shell.vue`, which switches panels.

## Inventory

Three sources, all writing `products`:

- **Maybach** (`src/lib/server/maybachSync.ts`). The sync aborts for a dealership if one run would remove more than 25% of its live inventory (`DROP_THRESHOLD`). See `sheds-store-maybach-contract`.
- **Google Sheets** (`src/lib/server/sheetSync.ts`).
- Manual entry in the dashboard.

Plan limits decide how many products buyers see (`src/lib/constants/planFeatures.ts`). Nothing is deleted when a lot is over its limit.

## Plans, prices and billing

- `src/lib/constants/billingPlans.ts` is the single source of truth for plan prices. Pages render these constants. Never hard-code a dealer price in a page or component.
- A plan can carry an `intro` rate that steps up after N months, per dealership. Anything quoting a dealer price uses `formatIntroTerms()`, not `monthlyAmount` alone.
- Moving existing dealers between plans: `setLotPlan()` in `@lib/server/billing/planChange`.
- Billing is **Authorize.Net**. The browser tokenizes cards with Accept.js (`src/lib/utils/acceptJs.ts`). The server vaults them and creates ARB subscriptions (`src/lib/server/authorizeNet/`, `src/lib/server/billing/`, `src/pages/api/authorize-net/`). `PUBLIC_AUTHORIZE_NET_SANDBOX` is read by both sides so they hit the same environment.
- Test against the sandbox. Never run a live charge from an agent. Merchant details are in `docs/agents/data.md`.

## Buyer-facing prices

- Listing price: `products` rows.
- Rent-to-own: `getRtoOptions(dealer, cashPrice)` in `@lib/utils/productDetailHelpers`. `terms_N_length` is the plan length and `divider_N_length` is the divisor. Payment is `cash / divider`, never `cash / months`.
- Same-as-cash: `sameAsCashLabel(dealer.cash_option, dealer.same_as_cash_days)` in `@lib/utils/dealerBadges`.
- Built-to-order shed price: Maybach's shed builder through `/api/shedbuilder/getShedPrice`.
