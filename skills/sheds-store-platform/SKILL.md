---
name: sheds-store-platform
description: How sheds.store runs on Cloudflare - one Worker serving several hostnames (apex, auth., dashboard., dealer subdomains, staging), middleware host routing and siteUrls, cache headers, environment variables versus runtime secrets, cron jobs, wrangler, and deploys. Use when adding a route or subdomain-aware page, touching middleware, caching, wrangler.jsonc, env vars or secrets, scheduled jobs, deploying, or debugging production on sheds.store.
---

# sheds.store platform

Astro builds the whole site into one Cloudflare Worker (`dist/_worker.js/index.js`) plus static assets. `src/worker-entrypoint.ts` wraps Astro's handler and adds `scheduled()` for crons. The account, Worker names, bindings and deploy target are in **`docs/agents/platform.md` in your sheds.store-new clone**. Read it before deploying or debugging production. Without a clone, say what you can't see and ask for access.

## One Worker, several hostnames

`src/middleware/index.ts` routes by the `Host` header, using `src/lib/utils/siteUrls.ts`:

| Host | Behaviour |
| --- | --- |
| `sheds.store` | Marketplace. Old `/auth/...` and `/dashboard/...` paths 301 to the subdomain. |
| `auth.sheds.store/<path>` | Rewritten to `src/pages/auth/<path>.astro`. |
| `dashboard.sheds.store/<path>` | Rewritten to `src/pages/dashboard/<path>.astro`. |
| `staging*.sheds.store` | `staging` is a label prefix (`stagingauth.sheds.store`). The environment is read off the host, so one build serves both. |
| `<slug>.sheds.store` | A dealer's stand-alone site. The label is looked up as `dealerships.storefront_subdomain`. `locals.standaloneDealer` tells pages to drop the marketplace chrome. |
| Any host that isn't sheds.store (localhost, `*.workers.dev`, `*.pages.dev`) | No rewriting. Internal paths work as written. |

Rules:

- Code uses internal paths (`/auth/signin`, `/dashboard`). Pass them through `urlFor(path, host)` when they become a link or a redirect.
- A new page under `src/pages/auth/` or `src/pages/dashboard/` goes into `AUTH_ROUTES` or `DASHBOARD_ROUTES` in `siteUrls.ts`. Unknown paths there redirect to the apex.
- A public page that should also work on a dealer's own site checks `Astro.locals.standaloneDealer` (see `src/pages/build-shed.astro`).

## Caching

The middleware sets `Cache-Control`:

- Anonymous GETs on public paths: `public, s-maxage=300, stale-while-revalidate=3600`.
- `/api`, `/dashboard`, `/auth`, `/reserve`, or any request carrying the `sbat` cookie: `private, no-store`.
- A route that sets its own `Cache-Control` is left alone.

So a public page can't show per-user data unless the request has `sbat`. Put personalised bits in an island that calls an `/api` route.

## Environment variables and secrets

| Kind | How it's read | Lands in |
| --- | --- | --- |
| `PUBLIC_*` | `import.meta.env.PUBLIC_X` | Inlined at build time, including the client bundle. Not secret. |
| Server secret | Declared in `astro.config.mjs` `env.schema` (`context: "server", access: "secret"`), read with `getSecret("X")` from `astro:env/server` | Read at runtime from the Worker's secret bindings. Works in `scheduled()` too. |

- Never read a server secret with `import.meta.env`. Vite inlines the build-time value into the Worker bundle. Some older modules still do this. Don't copy them, and don't widen it.
- An undeclared key reads as unset through `getSecret()`. Add the `envField` first.
- Some variables carry a `PUBLIC_` prefix but hold secrets, kept for compatibility. `docs/agents/secrets.md` lists them. Never render one into a page or send it to the browser.
- Set production secrets with `wrangler secret put <NAME>`. Local values come from 1Password (see `sheds-store-secrets`). `.env.example` lists every variable.

## Crons

Defined in `wrangler.jsonc` and dispatched in `scheduled()`:

- `0 6 * * *`: a sequential chain. Maybach inventory sync, Google Sheets sync, dealer image nudge emails, profile reminders, Google reviews refresh, city page provisioning (capped by `NIGHTLY_PROVISION_LIMIT`), city page regeneration. They run one after another because they share one invocation's subrequest budget. Each step catches its own error.
- `30 7 * * *`: billing only. The intro-pricing step-up, then closing ended subscriptions. It has its own trigger so a job that moves money never competes with the syncs for subrequests. `INTRO_BILLING_CRON` in the entrypoint must match this string.

A GitLab CI schedule in `.gitlab-ci.yml` also triggers the Maybach sync.

Cron code has no request, so there's no `locals.runtime.env`. Jobs get the `env` argument, and `getSecret()` works. Import job modules dynamically inside `scheduled()` so they stay out of the HTTP cold start.

A new cron job: add it to the existing chain unless it moves money or is heavy enough to need its own trigger. If it gets its own trigger, add the cron string to `wrangler.jsonc` and branch on `event.cron` the way `INTRO_BILLING_CRON` does.

## Build, preview, deploy

| Step | Command (use the lockfile's package manager) |
| --- | --- |
| Dev server | `pnpm dev` (port 4321, `0.0.0.0`) |
| Build | `pnpm build` |
| Run the built Worker locally | `pnpm preview` |
| Deploy | `pnpm run deploy` (`wrangler deploy`). Plain `pnpm deploy` is a pnpm built-in. |

Agents don't deploy to production. Open an MR; a maintainer deploys. Production deploys today are manual (`wrangler` or the dashboard). There's no Workers Builds trigger. Check the deploy target in `docs/agents/platform.md` before any deploy.

## Wrangler and Cloudflare tools

- `wrangler` is the deploy and secrets tool. Check `wrangler whoami` against the account in `docs/agents/platform.md`.
- `cf` (the Cloudflare CLI) is fine for read-only account queries: `cf zones list`, `cf dns records list --zone sheds.store`. It runs on Node, not Bun.
- The Cloudflare MCP server (`mcp.cloudflare.com/mcp`, Code Mode) covers the whole API. It comes with the official `cloudflare` plugin (`/plugin install cloudflare@claude-plugins-official`). Use it for anything the CLIs don't have, such as listing Worker routes and custom domains.
- Logs: Workers Observability is on for the production Worker. Query it in the dashboard or through the Cloudflare MCP, or `wrangler tail <worker>` for live logs.

Upstream Cloudflare skills (`cloudflare/skills`: `wrangler`, `workers-best-practices`, `durable-objects`, `cf-cli`, and others) install alongside this plugin. Use them for general Workers questions. Use this skill for how sheds.store does it.
