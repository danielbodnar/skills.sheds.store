# Spec: make the plugin publishable

Status: in progress, started 2026-10-13. Changes direction from [skills-worker-access.md](skills-worker-access.md), which kept everything private. Builds on [sheds-store-agent-kit.md](sheds-store-agent-kit.md).

## Goal

This repo can be published on a public GitHub or GitLab repo. Anything private lives in the private `sheds.store-new` repo, under `docs/agents/`. An agent gets it by having a clone, not by installing the plugin.

## What goes where

| Kind | Examples | Where |
| --- | --- | --- |
| How sheds.store is built | Astro, Vue islands, Tailwind, code layout, pricing helpers, design tokens, screenshots of public pages | Plugin |
| How to work | Branches, commit and MR style, checks, "agents don't deploy" | Plugin |
| Public hostnames | `sheds.store`, `auth.`, `dashboard.`, dealer subdomains | Plugin |
| Account and resource identifiers | Cloudflare account ID and inventory, Worker names, bucket names, Supabase project ref, 1Password IDs and names, GitLab and Duo IDs, Access team and token names | `docs/agents/` |
| Security mechanics | Which routes skip authentication, which secret guards which route, service-role write paths, credentials or payment accounts used by more than one product, cookie flags | `docs/agents/` |
| Production layout | Which repo and host run production, shared databases | `docs/agents/` |
| People | Names, usernames, email domains | `docs/agents/`, or nowhere |

A skill that needs a private fact names the file: "Read `docs/agents/maybach-contract.md` in your sheds.store-new clone." Without a clone, the agent says what it can't see and asks for access. It doesn't guess.

## Decisions

| Question | Decision |
| --- | --- |
| Where private details live | `sheds.store-new/docs/agents/`. It's the repo every sheds.store task already has checked out. Maybach-side agents are pointed there too. |
| Supabase MCP | Unscoped and read-only in the plugin. The project ref is in `docs/agents/data.md`. |
| Guard against regressions | `scripts/check-public.ts` fails CI on identifiers and listed private terms. |
| Public history | The current history holds the private details. Publish a fresh single-commit history, not this repo's. |
| skills.sheds.store | [changed] Public, no Access. It serves the scrubbed plugin, so Access comes off only after a scrubbed build is deployed. |
| Downloads | CI builds a `.skill` per skill (a zip with the skill folder at the root, the format Anthropic's `package_skill.py` makes), the plugin zip and `SHA256SUMS`. `package` on every pipeline, `deploy` to the site from the default branch, `release` on `v*` tags. |
| Marketplace | Both: `https://skills.sheds.store/marketplace.json` for anyone, the git URL for repo members. |
| README hero | An SVG of the plugin layout (`docs/plugin-layout.svg`) and a smaller screenshot. The full GitLab group map is private, in `docs/agents/repo-map.svg`. |

## Log

- 2026-10-13 [done] README hero replaced with `docs/plugin-layout.svg`; screenshot at 40% width.
- 2026-10-13 [todo] `docs/agents/` in sheds.store-new, with the group map SVG, on its own MR into `develop`.
- 2026-10-13 [todo] Scrub the skills, agents, templates, Duo files, README, site config, MCP configs and specs. Move the facts, don't drop them.
- 2026-10-13 [todo] `scripts/check-public.ts` in `bun run validate` and CI.
- 2026-10-13 [todo] Resync sheds.store-new (!58) and maybachsystems-com (!77) so their copies match.
- 2026-10-13 [blocked] Publishing. Needs a decision on where, and a fresh history.
- 2026-10-13 [done] `docs/agents/` in sheds.store-new, with the group map: sheds.store-new !61. Corrected the auth note while moving it: `force-sync`, `alerts` and `acknowledge-alert` use the dealer session, not the cron secret.
- 2026-10-13 [done] Skills, templates, Duo files, README, site config, MCP configs and specs scrubbed. `skills/sheds-store-platform/references/cloudflare.md` removed; its content is in `docs/agents/platform.md`.
- 2026-10-13 [done] `scripts/check-public.ts`, run by `bun run validate`. Specific names are stored as hashes so the script doesn't publish them.
- 2026-10-13 [done] CI jobs `package`, `deploy`, `release`; `build-site.ts` emits `.skill` files and `SHA256SUMS`.
- 2026-10-13 [todo] Deploy the scrubbed build, then remove the Access app.
- 2026-10-13 [todo] `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` CI/CD variables, so `deploy` runs.
- 2026-10-13 [done] Access removed after the scrubbed build was live. skills.sheds.store is public.
- 2026-10-13 [dropped] `scripts/sync.ts` and `templates/`. Plugins install per account (`claude plugin install --scope user|project`) and skills per user or repo (`bunx skills@latest add https://skills.sheds.store --all [-g]`). sheds.store-new !58 and maybachsystems-com !77 close unmerged.
- 2026-10-13 [changed] The marketplace lists only `sheds-store`. Vendor plugins (cloudflare, supabase, resend, gitlab, vue, 1password, google maps) come from their own marketplaces, so no two installed plugins share a name. MCP config keeps only Astro, Bun and Cloudflare docs.
- 2026-10-13 [changed] `writing-docs` and `systemavo-maybach-reference` renamed `sheds-store-writing-docs` and `sheds-store-systemavo-reference`, so every skill carries the prefix.
- 2026-10-13 [done] Per-skill `.tar.gz` archives put `SKILL.md` at the root, which the skills CLI requires. Verified: `bunx skills@latest add https://skills.sheds.store --all` installs all 10 skills.
- 2026-10-13 [changed] `check-public` reads private names from the masked `CHECK_PUBLIC_NAMES` CI variable; the list lives in sheds.store-new `docs/agents/check-public-names.txt`. The hashed list is gone.
- 2026-10-13 [done] Skills name no dependency versions. `validate` fails on library-plus-version mentions.
- 2026-10-13 [done] A page per skill at `/skills/<name>/`: file tree, rendered and source views, install command and prompt, downloads.
- 2026-10-13 [done] CI job `mirror` pushes `main` and tags to github.com/danielbodnar/skills.sheds.store with a write deploy key (masked, protected `GITHUB_MIRROR_SSH_KEY`). GitLab's own push mirror can't take SSH host keys through the API.
- 2026-10-13 [blocked] `CLOUDFLARE_API_TOKEN` for the `deploy` job. The available Cloudflare login can't create API tokens (403 on `/user/tokens`); a person creates it in the dashboard.
- 2026-10-13 [todo] Next spec: an MCP server or MCP App that lets anyone search sheds.store inventory from claude.ai and Claude Desktop.
