---
name: sheds-store-contributing
description: How to ship a change to sheds.store and the other davidbodnar GitLab repos - cloning with glab, branching from develop, conventional commit and MR titles, the checks to run before pushing, opening a merge request with glab, MR description contents, and per-repo conventions. Use when committing, pushing, opening or updating a merge request, picking a target branch, or preparing work for review in any gitlab.com/davidbodnar repo.
---

# Contributing

Everything is on GitLab.com under `davidbodnar`. Use `glab` (its own skills, from `glab skills install`, cover the CLI in depth). Authenticate once with `glab auth login --hostname gitlab.com`.

## Flow for sheds.store-new

```sh
glab repo clone davidbodnar/sheds.store/sheds.store-new
cd sheds.store-new
git switch develop && git pull
git switch -c feat/shed-price-calculator
# … work …
pnpm install --frozen-lockfile   # or bun install --frozen-lockfile, per the lockfile
pnpm build
git add -A && git commit -m "feat: add shed price calculator"
git push -u origin HEAD
glab mr create --target-branch develop --title "feat: add shed price calculator" \
  --remove-source-branch --yes --description "$(cat <<'EOF'
## What
…
EOF
)"
```

Pass the description inline with a quoted heredoc, as above. Don't write it to a file in the repo.

- **Branch from `develop`, target `develop`.** `main` is protected. Maintainers merge `develop` into `main` to release.
- Branch names: `feat/<thing>`, `fix/<thing>`, `refactor/<thing>`, `docs/<thing>`, `chore/<thing>`.
- Commit and MR titles: Conventional Commits, lower case after the type. `feat: …`, `fix: …`, `refactor: …`, `docs: …`, `chore: …`. A scope is optional (`feat(city-pages): …`).
- One topic per MR. Don't mix a feature with an unrelated reformat or a lockfile churn.
- Don't commit generated or local files: `dist/`, `.astro/`, `.wrangler/`, `.env*`, `node_modules/`, `*.duckdb`, `.tmp/`.
- Don't add a second lockfile. If `pnpm-lock.yaml` is committed, don't add `bun.lock`, and the reverse.

## Before you push

- [ ] The build passes.
- [ ] You loaded the page in `pnpm preview` (or `pnpm dev`) at phone width and in dark mode.
- [ ] No React, JSX, or new UI library in the diff (`git diff develop --stat`, then search for `react`).
- [ ] New `auth/` or `dashboard/` pages are in `siteUrls.ts`.
- [ ] New server secrets are declared in `env.schema` and listed in `.env.example` (name only).
- [ ] New migrations are additive and include RLS.
- [ ] Nothing secret in the diff.

## MR description

```markdown
## What
One or two sentences on what changes for a buyer, dealer, or admin.

## Why
The problem or request.

## How
Files and approach, briefly. Mention reused helpers.

## Checks
- `pnpm build` passes
- Tested: <pages/flows you tried>

## Deploy notes
Secrets to set, migrations to apply, Maybach changes needed. "None" if none.
```

Link the issue with `Closes #<n>` when there is one. Screenshots for UI changes (light and dark).

## Agents

- Open MRs; don't merge them, and don't push to `main`.
- Don't deploy (`wrangler deploy`), set production secrets, or apply migrations to production. Put those steps in "Deploy notes".
- Write commit messages and MR text plainly, as the person you're working for. No AI attribution lines unless asked.

## Repo conventions

| Repo | Default / target | Titles | Checks |
| --- | --- | --- | --- |
| `sheds.store/sheds.store-new` | `develop` | `feat: …` | build |
| `sheds.store/skills` (this plugin) | `main` | `feat: …` | `bun run validate` |

Read a repo's own `AGENTS.md` / `CLAUDE.md` before working in it. Branch targets and checks for the Maybach, SystemAvo and brand-site repos are in `docs/agents/related-repos.md` in your sheds.store-new clone.
