---
name: sheds-store-secrets
description: How to get and handle secrets for sheds.store local development and deploys - where the values live (a 1Password Environment, Cloudflare Worker secrets), loading them with op run, public versus server variables, adding a new variable, and the rules for never leaking a value. Use when setting up a local .env, running sheds.store-new locally, adding a new environment variable or secret, rotating a key, or when a build or API call fails for a missing credential.
---

# sheds.store secrets

Values live in two places:

| Where | What |
| --- | --- |
| A 1Password Environment | Local and staging values for every variable in `.env.example` |
| Cloudflare Worker secrets on the production Worker | Production values. Write-only: `wrangler secret list` shows names, never values. |

The Environment's ID, the vault with dashboard logins, and what each variable is for are in **`docs/agents/secrets.md` in your sheds.store-new clone**. Read it before you set up `.env` or touch a secret. No clone, or no access to it: say so and ask a maintainer. Don't guess names or IDs.

## Run the app with secrets

Load the Environment into the process, so nothing touches disk:

```sh
op run --environment <environment-id> -- pnpm dev
```

Or mount it as a local `.env` from the 1Password desktop app (Developer > Environments > Destinations > Local .env file, path `<checkout>/.env`). 1Password serves the file while the app is unlocked and doesn't write it to disk in plain text.

Check what's set, by name only:

```sh
op environment read <environment-id> | cut -d= -f1
```

If a variable is missing, ask a maintainer to add it. Don't paste a value into a file, a commit, an issue, or a chat.

## Public and server variables

| Kind | Read with | Lands in |
| --- | --- | --- |
| `PUBLIC_*` | `import.meta.env.PUBLIC_X` | Inlined at build time, including the browser bundle. Treat it as public. |
| Server secret | `getSecret("X")` from `astro:env/server`, declared in `astro.config.mjs` `env.schema` | Read at runtime from the Worker's secret bindings |

`.env.example` lists every variable by name. Some older names carry a `PUBLIC_` prefix but hold secrets. `docs/agents/secrets.md` says which. Never render those into a page or send them to the browser.

## Adding a variable

1. Decide if it's public. Only values that are safe in the browser get a `PUBLIC_` prefix.
2. For a server secret: add an `envField` under `env.schema` in `astro.config.mjs` (`context: "server", access: "secret"`), read it with `getSecret()`, and add the name (no value) to `.env.example`.
3. Add the value to the 1Password Environment, or ask a maintainer to.
4. In the MR description, say the production secret needs setting with `wrangler secret put <NAME>`. Don't run that from an agent.

## Never

- Commit `.env`, `.dev.vars`, or any file with a value in it. GitLab secret detection runs on these repos.
- Read a server secret with `import.meta.env`, or log a secret's value.
- Use production payment keys locally. Use the sandbox.
- Print `op` output that contains values into a transcript. Pipe through `cut -d= -f1` when you only need names.

The upstream 1Password plugin (`1Password/1password-claude-plugin`) adds an Environments MCP and a skill. The MCP needs the 1Password desktop app and doesn't return secret values; `op run` above works without it.
