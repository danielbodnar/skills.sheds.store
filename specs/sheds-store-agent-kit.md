# Spec: sheds-store agent kit

Status: in progress, started 2026-10-13.

## Goal

One repo, `davidbodnar/sheds.store/skills`, that any coding agent can install to learn how sheds.store is built and how to ship changes to it. After installing, an agent should build features in the existing stack and open a merge request that a reviewer can accept without a rewrite.

The trigger: a pricing calculator was built for sheds.store in React. The site doesn't use React. The plugin exists so the next agent knows that before it writes a line.

## Acceptance test

1. In a fresh Claude Code session with no project context:
   `/plugin marketplace add https://gitlab.com/davidbodnar/sheds.store/skills.git`, then `/plugin install sheds-store@sheds-store`.
2. Open a checkout of `sheds.store-new` and prompt: "Build a shed price calculator for sheds.store."
3. Pass if the agent:
   - proposes a Vue 3 single-file component mounted as an island in an Astro page, styled with Tailwind using the design-system tokens;
   - doesn't add React, Preact, or a new UI library;
   - detects the package manager from the committed lockfile;
   - adds any new `auth`/`dashboard` page to `siteUrls.ts`;
   - branches from `develop`, uses a conventional commit, and opens an MR targeting `develop` with `glab mr create`.
4. The same skills load in Codex (`.agents/skills/`), GitLab Duo (`.agents/skills/` in the target repo), and VS Code/Copilot (plugin or `.github/copilot-instructions.md`).

Prerequisite for a private-repo install: git must already be able to clone `gitlab.com/davidbodnar/sheds.store/skills` without a prompt, for example after `glab auth login --hostname gitlab.com --git-protocol https`.

## Scope

| Area | Treatment |
| --- | --- |
| `sheds.store/sheds.store-new` | Primary. Every skill is written for this repo. |
| Maybach integration surface | One skill: the API contract between Maybach and sheds.store (products feed, shed builder proxy, reviews, phone verification, Quick Setup billing). |
| `cth/maybachsystems-com`, `cth/refresh` | Reference only, in a skill marked "not sheds.store". Laravel 10, Livewire 3, Pest. |
| `cth/systemavo`, PHP brand sites, `cth/blogs` | One table in the same reference skill. |
| Legacy sheds.store repos (`sheds.store`, `new.sheds.store`, `shedsstore`, `app.sheds.store`, `ops`) | Listed as superseded. Agents don't open MRs there. |

Skills say "sheds.store" first and name Maybach and SystemAvo only where code crosses the boundary. The repos are intermingled today, so the boundary is spelled out rather than implied.

## Layout

```text
skills/                          # this repo
├── skills/<name>/SKILL.md       # canonical, flat, dir name == name
├── agents/sheds-store-engineer.md
├── .claude-plugin/plugin.json   # Claude Code, claude.ai, Cowork, Desktop
├── .claude-plugin/marketplace.json
├── .mcp.json                    # Claude MCP schema
├── plugin.json                  # Agent Plugins 1.0: Codex, VS Code, Copilot CLI, omp
├── mcp.json                     # Agent Plugins MCP schema
├── gemini-extension.json
├── package.json                 # pi package + bun scripts
├── templates/                   # files synced into consumer repos
├── duo/                         # GitLab Duo custom agent + handoff API calls
├── scripts/                     # never bin/: claude.ai rejects plugins with bin/
└── specs/
```

Skills (all flat under `skills/`):

| Skill | Covers |
| --- | --- |
| `sheds-store` | Entry point. What sheds.store is, repo map, stack, hard rules, which skill to load next. |
| `sheds-store-frontend` | Astro pages, Vue 3 islands, hydration directives, nanostores, path aliases, building a new widget, porting React to Vue. |
| `sheds-store-design-system` | Tokens, type, colour, components, layout rules. Ships `DESIGN.md` and `references/tokens.json`. |
| `sheds-store-platform` | The Worker: host routing, caching, env and secrets, crons, wrangler, deploy flow, Cloudflare account. |
| `sheds-store-data` | Supabase clients and RLS, migrations, dealer lifecycle, Authorize.Net billing. |
| `sheds-store-maybach-contract` | The integration contract above. |
| `sheds-store-contributing` | Branching, commits, MR workflow, checks before an MR, per-repo conventions across the group. |
| `sheds-store-secrets` | 1Password Environment `sheds.store`, `op run`, which variable lives where. |
| `systemavo-maybach-reference` | The non-sheds.store repos, clearly labelled. |

Upstream vendor skills aren't copied. `marketplace.json` lists them as separate plugins pinned by commit SHA: `cloudflare/skills`, `supabase/agent-skills`, `vuejs-ai/skills`, `resend/resend-skills`, `googlemaps/agent-skills`, `1Password/1password-claude-plugin`. The `glab` skills come from `glab skills install`. Pinning is a supply-chain control. It's separate from skill content, which doesn't pin versions and points at `@latest` docs.

MCP servers shipped in `.mcp.json` / `mcp.json`:

| Server | URL | Auth |
| --- | --- | --- |
| Cloudflare (Code Mode) | `https://mcp.cloudflare.com/mcp` | OAuth or API token |
| Cloudflare docs | `https://docs.mcp.cloudflare.com/mcp` | none |
| Astro docs | `https://mcp.docs.astro.build/mcp` | none |
| Bun docs | `https://bun.com/docs/mcp` | none |
| GitLab | `https://gitlab.com/api/v4/mcp` | OAuth (`mcp` scope) |
| Supabase | `https://mcp.supabase.com/mcp?read_only=true` | OAuth |
| Resend | `https://mcp.resend.com/mcp` | OAuth or API key |

## Consumer-repo sync

GitLab Duo has no group-level skills or rules. Each project carries its own. So `scripts/sync.ts` writes these into a target checkout on a branch and opens an MR:

- `AGENTS.md`: a marked block, so a repo's own content outside it survives.
- `.agents/skills/`: copied from `skills/`. Duo, Codex, OpenCode, Zed, pi and Copilot read it.
- `.gitlab/duo/chat-rules.md`, `.gitlab/duo/mcp.json`
- `.github/copilot-instructions.md`, `.vscode/mcp.json`

First target: `sheds.store-new`, MR into `develop`, cut from `origin/develop` in a worktree (the main checkout has unrelated uncommitted work).

## GitLab Duo

| Item | How | Owner |
| --- | --- | --- |
| Skills, AGENTS.md, chat rules in each project | Consumer-repo sync | this repo |
| Custom agent "sheds.store engineer" | `aiCatalogAgentCreate`, visibility `RESTRICTED`, created from `sheds.store/skills`. Chat only, no triggers. | this repo (Maintainer on `sheds.store`) |
| Turn on agents, flows, custom and external agents | `PUT /groups/davidbodnar` with `ai_settings_attributes`, plus UI toggles | top-level group Owner |
| External agent (Claude Code) on issues and MRs | GitLab.com blocks custom external agents. Use the managed Claude Code Agent (AI Catalog 2337); it may need GitLab support to enable. | top-level group Owner |

The top-level group returns 403 for this account, so the last two rows are a handoff, written as exact API calls in `duo/README.md`.

## Design system

Extract from `sheds.store-new` (`tailwind.config.cjs`, `src/assets/styles/`, `src/layouts/`) and the live site. Output: `skills/sheds-store-design-system/DESIGN.md` (also readable by Claude Design), `references/tokens.json`, and a component inventory.

## Secrets

A 1Password Environment, sourced from the team vault (IDs in sheds.store-new `docs/agents/secrets.md`). The variable names are the ones in `sheds.store-new/.env.example`. The skill teaches `op run --env-file` and the mounted local `.env` file. The Environments MCP needs the desktop app, and its Linux support for the Claude plugin is unconfirmed, so it's optional.

## Cloudflare inventory

Workers, routes and DNS for the Cloudflare account. Now in sheds.store-new `docs/agents/platform.md`.

## Log

- 2026-10-13 [done] Research: Duo Agent Platform, cross-vendor plugin formats, upstream skills and MCPs, group repo survey.
- 2026-10-13 [done] Audited `plugins@1.3.5` (Socket supply chain 88, `unstableOwnership`). Tarball integrity matches; the 1.3.4→1.3.5 diff is a refactor; telemetry off with `DO_NOT_TRACK=1`. Use only as `bunx plugins@1.3.5 discover`, never as a dependency. It reads the legacy `.plugin/` format, so `claude plugin validate` is the real gate.
- 2026-10-13 [changed] Package manager: skills tell agents to follow the committed lockfile, not a fixed tool.
- 2026-10-13 [changed] Calculator port from the React version is deferred. The acceptance test uses a fresh calculator prompt instead.
- 2026-10-13 [blocked] Cloudflare inventory, until `cf`/`wrangler` are authenticated on the `davidbodnar` profile.
- 2026-10-13 [blocked] 1Password Environment population, until the desktop app authorizes the Environments MCP.
- 2026-10-13 [changed] Cloudflare inventory unblocked and written to `skills/sheds-store-platform/references/cloudflare.md` (since moved to sheds.store-new `docs/agents/platform.md`). Production deploys are manual (wrangler or dashboard); no Workers Builds trigger. The Worker name in `wrangler.jsonc` on `develop` doesn't match production.
- 2026-10-13 [blocked] 1Password Environment `sheds.store` exists but is empty. The vault holds dashboard logins, not the app's API keys, and production values exist only as write-only Worker secrets. A maintainer has to add the values; the secrets skill documents `op run --environment`.
- 2026-10-13 [done] Nine sheds.store skills, `sheds-store-engineer` agent, Claude/Agent Plugins/Gemini manifests, MCP config, templates, `scripts/sync.ts`, `scripts/validate.ts`, CI validate job.
- 2026-10-13 [done] Design system extracted from code into `sheds-store-design-system` (`DESIGN.md`, `references/tokens.json`). Not yet checked against screenshots of the live site.
- 2026-10-13 [done] Duo custom agent "sheds.store engineer" created (AI Catalog item 1018111, Restricted) and enabled in `sheds.store/skills` and `sheds.store/sheds.store-new`. Group settings and the managed Claude Code agent are handed off in `duo/README.md`.
- 2026-10-13 [done] Acceptance test, plan-only: a headless Claude Code session with only this plugin, in a clean `develop` worktree, proposed a Vue Options API island, reused `getRtoOptions()`, picked pnpm from the lockfile, and planned `feat/` → `develop`. No React.
- 2026-10-13 [changed] Added `writing-docs` (copied from `danielbodnar/systemd-design-specs`) and a `sheds-store-docs-writer` agent adapted from covenantdenton.org's `docs-writer`. Left out covenantdenton's `content-import` and `sermon-editing`: they're EmDash and church-specific.
- 2026-10-13 [dropped] Repo-map rows for one-off tooling (MySQL-to-D1 migration, DBA agent, log ETL, e2e toolkit, old brand-site copies, blogs Worker). They're out of date; the reference skill says so instead of describing them.
- 2026-10-13 [done] MRs opened: skills !1 (`feat/agent-kit` → `main`), sheds.store-new !58 (`chore/agent-kit-sync` → `develop`, synced files only).
- 2026-10-13 [done] Checked the design system against the live site with screenshots (stored in the skill's `assets/screenshots/`). Dark mode is styled but can't be turned on by visitors. Dashboard not checked: it needs a login.
- 2026-10-13 [done] README refresh in sheds.store-new (!59) written by the docs-writer agent. Its feedback corrected the platform, secrets, contributing and docs-writer content.
- 2026-10-13 [done] `--profile maybach` for the sync script; maybachsystems-com !77.
- 2026-10-13 [todo] Port the React pricing calculators once their source is available.
- 2026-10-13 [done] MR !1 merged into `main`.
- 2026-10-13 [changed] The plugin is being made publishable. Account IDs, secrets mapping, the Maybach contract and the repo map move to sheds.store-new `docs/agents/`. See [public-plugin.md](public-plugin.md).
- 2026-10-14 [done] Logos and favicons in the design system (`assets/brand/`): vector logo, an on-dark variant, the barn mark, and the favicon set. skills.sheds.store uses them.
- 2026-10-14 [done] Accessibility pass using Chrome's modern-web-guidance guides and axe-core (WCAG 2.2 AA) in light and dark. Measured contrast pairs and rules went into the design-system skill. New work uses `#222` text on tan buttons, because white on tan is 2.1:1. `sheds-store-frontend` ships `scripts/a11y-audit.ts`. skills.sheds.store passes on every page in both themes.
- 2026-10-14 [done] Skill fixes from the SpaceFit port (sheds.store-new !62): working local preview (`wrangler dev`, since `astro preview` isn't supported), the build-time Supabase variables, real data only in shipped code, per-visitor data through `/api` routes, where engine and component-local helpers go, and commit an outside port unchanged first.
- 2026-10-14 [todo] sheds.store-new MR with the same contrast, focus-ring and touch-target fixes for the live site.
- 2026-10-14 [todo] Make the a11y audit a CI job. It needs `playwright-core` (Socket quality 79) and `axe-core` (license 70, MPL-2.0) as dev dependencies, which needs a decision first.
