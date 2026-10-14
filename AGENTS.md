# Agent instructions

This repo is the `sheds-store` agent plugin: skills, rules and MCP config for building sheds.store. The skills under `skills/` are the source of truth. Every vendor manifest points at them.

## Commands

| Command | What it does |
| --- | --- |
| `bun run validate` | Checks skill frontmatter, manifests and MCP config, runs `scripts/check-public.ts`, then `claude plugin validate .` |
| `bun run site:build` | Builds the `.skill` files, plugin zip, marketplace and landing page into `site/dist/`, from `git archive HEAD` |

## Rules for editing this repo

- One skill per directory, `skills/<name>/SKILL.md`, and the directory name equals `name`. No nesting.
- Keep `.claude-plugin/plugin.json` and the root `plugin.json` versions in step.
- No top-level `bin/`. claude.ai rejects plugins that have one. Scripts go in `scripts/`.
- Don't copy upstream vendor skills in. Reference them in `.claude-plugin/marketplace.json` by commit SHA.
- `skills/sheds-store-writing-docs/` is copied from `danielbodnar/systemd-design-specs` (`skills/writing-docs`, commit `e4acb64`), renamed with the `sheds-store-` prefix. Change it upstream, copy it again, then reapply the rename.
- Skills describe sheds.store first. Maybach and SystemAvo appear only where code crosses into them.
- This repo is publishable. Account IDs, secret locations, auth mechanics, production layout and people go in sheds.store-new `docs/agents/`, and the skill names the file. `bun run validate` enforces it.

## Specs

- in progress 2026-10-13 — [specs/sheds-store-agent-kit.md](specs/sheds-store-agent-kit.md) — the plugin: skills, manifests, consumer sync, Duo agent, design system.
- superseded 2026-10-13 — [specs/skills-worker-access.md](specs/skills-worker-access.md) — serve the plugin from skills.sheds.store behind Cloudflare Access. Replaced by public-plugin.
- in progress 2026-10-13 — [specs/public-plugin.md](specs/public-plugin.md) — make the plugin publishable; private details move to sheds.store-new `docs/agents/`.
