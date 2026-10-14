# Spec: serve the plugin from skills.sheds.store behind Cloudflare Access

Status: superseded 2026-10-13 by [public-plugin.md](public-plugin.md): the site goes public and Access is removed. Started 2026-10-13. Follows [sheds-store-agent-kit.md](sheds-store-agent-kit.md).

## Goal

Install the plugin without GitLab repo access, from `https://skills.sheds.store`, while keeping all of it private. Several skills describe infrastructure: account IDs, secret names, the Maybach write path into Supabase. They mustn't be public.

## Decisions

| Question | Decision |
| --- | --- |
| Public or private | Everything behind Cloudflare Access. Nothing is public. |
| Hostname | `skills.sheds.store`, a custom domain on its own Worker, `sheds-store-skills`. |
| Who gets in | Target: members of the `davidbodnar` GitLab group, through GitLab OIDC sign-in. GitHub sign-in for listed emails. Contributors need a GitLab or GitHub developer account. |
| Sign-in for now | One-time PIN by email, because the GitLab and GitHub OAuth apps can't be created through an API. Allowed: the company email domain plus an Access group of named emails. Swap to GitLab OIDC when the application exists. |
| Headless agents and CI | An Access service token (`CF-Access-Client-Id` / `CF-Access-Client-Secret`). |
| Source of truth | The private GitLab repo. The Worker serves a build of it. |

## What the Worker serves

Static assets only. There's no Worker script.

| Path | Consumer |
| --- | --- |
| `/` | Landing page with install instructions |
| `/.well-known/agent-skills/index.json` | `skills` CLI discovery, schema `https://schemas.agentskills.io/discovery/0.2.0/schema.json` |
| `/.well-known/agent-skills/<name>.tar.gz` | One archive per skill, with a `sha256` digest in the index |
| `/marketplace.json` | Claude Code `url` marketplace. The `sheds-store` entry is an `archive` source with a `sha256` pin. Upstream vendor entries keep their GitHub sources. |
| `/plugins/sheds-store.zip` | The whole plugin, for Claude Code, and for manual upload to claude.ai or Cowork |

## How each client authenticates

| Client | How |
| --- | --- |
| Browser | Access sign-in page |
| Claude Code | `cloudflared access login https://skills.sheds.store` once. Then the marketplace's `headersHelper` runs `cloudflared access token` and sends it as `cf-access-token`. |
| `skills` CLI | Doesn't send headers. Download with `cloudflared access curl`, then `bunx skills add ./<dir>`. Or install from the GitLab repo. |
| CI, GitLab Duo external agents | Service token headers |

## Changes elsewhere

- `sheds.store-new`: add `skills` to `RESERVED_SUBDOMAINS` so no dealer can claim it. Its own MR into `develop`.

## Log

- 2026-10-13 [done] `scripts/build-site.ts` and `site/wrangler.jsonc`. Worker `sheds-store-skills` deployed. Access app "sheds.store skills" (one-time PIN; Access group "sheds.store skills readers" = the company email domain plus listed emails) and service token "skills.sheds.store agents" (stored in 1Password, expires 2027-10-14).
- 2026-10-13 [changed] The custom domain alone lost to the main site's `*.sheds.store/*` route. Added a `skills.sheds.store/*` route to pin it.
- 2026-10-13 [done] Verified: anonymous requests get a 302 to Access on every path; the service token gets 200; Claude Code installed the plugin from `/marketplace.json` with a `headersHelper`.
- 2026-10-13 [done] `RESERVED_SUBDOMAINS` MR: sheds.store-new !60.
- 2026-10-13 [todo] The `skills` CLI can't send Access headers, so `bunx skills add https://skills.sheds.store` fails. Documented the `cloudflared access curl` workaround.
- 2026-10-13 [todo] GitLab OIDC identity provider and group-membership policy, once a GitLab application exists (callback URL in sheds.store-new `docs/agents/agent-kit.md`).
- 2026-10-13 [changed] "Nothing is public" is reversed: the plugin is being made publishable, and the private details move to sheds.store-new `docs/agents/`. See [public-plugin.md](public-plugin.md). Access stays on until the public repo exists.
- 2026-10-13 [changed] Access is dropped. The site will serve the scrubbed, publishable plugin to anyone, with downloads built in CI. See [public-plugin.md](public-plugin.md).
- 2026-10-13 [dropped] GitLab OIDC sign-in and the `skills` CLI workaround: not needed once the site is public.
