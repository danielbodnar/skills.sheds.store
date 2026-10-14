---
name: sheds-store
description: Start here for any work on sheds.store, the shed marketplace at https://sheds.store (GitLab davidbodnar/sheds.store/sheds.store-new). Covers what the product is, which repo is live, the stack (Astro + Vue islands + Tailwind + Supabase on one Cloudflare Worker), the rules that get an MR rejected, and which sheds-store-* skill to load next. Use before writing any code, page, component, calculator, API route or migration for sheds.store, and when a request mentions sheds.store, Sheds Store, dealer lots, shed listings, or the dealer dashboard.
---

# sheds.store

Sheds.store is a shed marketplace. Buyers search dealer inventory by location. Dealers sign up, pay a subscription, and manage their lot from a dashboard. Some dealers also get a stand-alone site at `<slug>.sheds.store`.

## Which repo

| Repo | Status |
| --- | --- |
| `davidbodnar/sheds.store/sheds.store-new` | **The live site.** All sheds.store work goes here. |
| `davidbodnar/sheds.store/skills` | This plugin. |
| `davidbodnar/sheds.store/sheds.store`, `new.sheds.store`, `shedsstore`, `app.sheds.store`, `ops` | Superseded or archive. Don't open MRs there. |
| `davidbodnar/cth/*` | Maybach and SystemAvo. Not sheds.store. See `sheds-store-systemavo-reference`. |

Clone: `glab repo clone davidbodnar/sheds.store/sheds.store-new`. Work from `develop`.

This plugin is public, so it leaves out account IDs, secret locations, auth details and the map of related repos. They're in `docs/agents/` in the sheds.store-new clone, and the skills say which file to read. If you need one and have no clone or no access, say so and ask. Don't guess.

## Stack

| Layer | What's used | Not used |
| --- | --- | --- |
| Framework | Astro, SSR (`output: "server"`) | Next.js, Remix, SvelteKit |
| Interactive UI | Vue single-file components, mounted as Astro islands | **React**, Preact, Solid, Svelte, Alpine |
| State across islands | nanostores via `@nanostores/vue` (`src/store/store.ts`) | Redux, Zustand, Pinia |
| Styling | Tailwind CSS with the theme in `src/config/theme.json`, plus SCSS partials in `src/assets/styles/` | CSS-in-JS, shadcn/ui, Material, Bootstrap JS |
| Data | Supabase (Postgres, Auth, Storage) | Prisma, Drizzle, a second database |
| Runtime | One Cloudflare Worker with static assets, cron triggers | Vercel, Netlify, Node server |
| Payments | Authorize.Net (Accept.js in the browser, server vaulting) | Stripe |
| Email | Resend | |
| 3D | three.js (shed builder) | |

The package manager is whatever the committed lockfile says. Check before installing anything: `pnpm-lock.yaml` means pnpm, `bun.lock` means bun. Don't add a second lockfile.

## Rules that get an MR rejected

1. **No React.** Not for a widget, a calculator, or a prototype. Interactive UI is a Vue SFC in `src/components/vue/<area>/`, mounted from an `.astro` page with a `client:*` directive. If you were handed React code, port it to Vue (see `sheds-store-frontend`).
2. **No new UI framework or component library.** Use Tailwind, the theme tokens, and the existing `.btn-*` and `.dash-*` classes.
3. **No new server secret through `import.meta.env`.** Vite inlines it into the Worker bundle. Declare it in `astro.config.mjs` under `env.schema` and read it at runtime with `getSecret()` from `astro:env/server` (or the repo's wrapper, if one exists by then). Never give a secret a `PUBLIC_` prefix.
4. **A new page under `src/pages/auth/` or `src/pages/dashboard/` is added to `AUTH_ROUTES` or `DASHBOARD_ROUTES` in `src/lib/utils/siteUrls.ts`.** Otherwise it's unreachable on its subdomain.
5. **Links and redirects go through `urlFor(path, host)`.** Code uses internal paths (`/auth/signin`, `/dashboard`).
6. **Reuse the existing business logic.** Rent-to-own payments come from `getRtoOptions()` in `src/lib/utils/productDetailHelpers.ts`, not `price / months`. Shed builder prices come from Maybach through `/api/shedbuilder/getShedPrice`.
7. **Branch from `develop`, MR into `develop`, conventional commit titles.** See `sheds-store-contributing`.
8. `pnpm build` (or the bun equivalent) passes before the MR. There's no test suite; the build is the check.
9. **No versions from memory.** These skills name no dependency versions on purpose. In the repo, use what `package.json` and the lockfile pin, and don't upgrade as a side effect of another change. In a prototype or artifact outside the repo, use each library's current stable release, looked up when you write it (`npm view <package> version`, or the CDN's latest). Never copy an old version out of training data.

## Load next

| Task | Skill |
| --- | --- |
| Pages, components, islands, calculators, forms | `sheds-store-frontend` |
| Colours, type, spacing, buttons, cards, dark mode, `DESIGN.md` | `sheds-store-design-system` |
| Routing by hostname, caching, env vars, crons, wrangler, deploys | `sheds-store-platform` |
| Supabase clients, RLS, migrations, dealer signup, billing | `sheds-store-data` |
| Anything touching Maybach: inventory sync, shed builder API, Quick Setup billing | `sheds-store-maybach-contract` |
| Branches, commits, MRs, checks, repo conventions | `sheds-store-contributing` |
| Getting secrets for local dev | `sheds-store-secrets` |
| Work in a Maybach or SystemAvo repo | `sheds-store-systemavo-reference` |
| README, AGENTS.md, docs, MR descriptions, blog posts | `sheds-store-writing-docs` |

If the checkout has its own `CLAUDE.md` or `AGENTS.md`, it's more specific than these skills. Read it first, and follow it where they disagree.

## Docs

Look up current APIs rather than relying on memory. Docs MCP servers in this plugin: Astro, Bun and Cloudflare. Vue: [vuejs.org/guide](https://vuejs.org/guide/). Tailwind: [tailwindcss.com/docs](https://tailwindcss.com/docs), matched to the major version the repo's `package.json` uses.
