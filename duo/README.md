# GitLab Duo setup

How sheds.store's agent setup maps onto the GitLab Duo Agent Platform, and what still needs an owner of the top-level `davidbodnar` group.

## What reads what

| Duo surface | Reads | Comes from |
| --- | --- | --- |
| Agentic Chat (UI, IDE, Duo CLI), foundational and custom flows | `AGENTS.md`, `.gitlab/duo/chat-rules.md` | Committed in each repo, written by hand |
| Local Chat (VS Code, Duo CLI), flows | Agent skills in `.agents/skills/<name>/SKILL.md` | `bunx skills@latest add https://skills.sheds.store --all` in the repo. Duo CLI can also read user-level skills (`-g`) with `GITLAB_ENABLE_GLOBAL_SKILLS=true`. |
| IDE and Duo CLI | MCP servers in `.gitlab/duo/mcp.json` or `~/.gitlab/duo/mcp.json` | Committed in the repo, or per user |
| UI Chat | Not skills. Only `AGENTS.md`, chat rules, and the custom agent's prompt. | |

There's no group-level location for skills or rules. Each project carries its own `AGENTS.md`, and skills come from an install per repo or per user.

## Custom agent: "sheds.store engineer"

- An AI Catalog item owned by project `davidbodnar/sheds.store/skills`, visibility **Restricted** (usable across the group, hidden from Explore). Its ID is in `docs/agents/agent-kit.md` in sheds.store-new.
- Enabled in `sheds.store/skills` and `sheds.store/sheds.store-new`.
- Prompt: [system-prompt.md](system-prompt.md). Tools: [agent-tools.txt](agent-tools.txt).
- Change either file, then run `duo/create-agent.sh` to update it. `--dry-run` shows the payload.
- Use it from Chat: pick "sheds.store engineer" in the agent selector. Custom agents can't be triggered from issues or MRs.

## Needs a top-level group Owner

The account that set this up is Maintainer on `davidbodnar/sheds.store` and gets 403 on the `davidbodnar` group. These steps need an Owner of `davidbodnar`.

### 1. Check the Duo settings

Settings > GitLab Duo > Change configuration on the `davidbodnar` group. Turn on:

- GitLab Duo Agentic Chat, agents, and flows
- Allow custom agents
- Allow custom flows
- Allow external agents (for step 3)
- Allow external MCP tools

The same through the API:

```sh
GITLAB_HOST=gitlab.com glab api --method PUT groups/davidbodnar \
  -f 'ai_settings_attributes[duo_agent_platform_enabled]=true' \
  -f 'ai_settings_attributes[duo_workflow_mcp_enabled]=true'
```

Skills, rules and external agents need Premium or Ultimate. Custom agents and flows also run on Free with GitLab Credits.

### 2. Allow GitLab's MCP server for the group

`gitlab.com/api/v4/mcp` (from the official `gitlab` plugin, or configured by hand) needs a top-level group owner to allow MCP access before members' tokens work.

### 3. External agent on issues and MRs (Claude Code)

GitLab.com doesn't allow custom external agents. Use GitLab's managed **Claude Code Agent** (AI Catalog item 2337):

1. Explore > AI Catalog > Claude Code Agent > Enable, in `davidbodnar/sheds.store/sheds.store-new`.
2. Choose triggers: mention and assign.
3. If it isn't offered, ask GitLab Support to enable external agents for the namespace.

It runs in CI on GitLab-hosted runners, reads the repo's `AGENTS.md`, and pushes `feature/*` branches with an MR. CI/CD variables aren't passed to it, so it can't read sheds.store's secrets; that's intended.

Protect the agent's config files with CODEOWNERS: `.gitlab/duo/` and `AGENTS.md`.

## Not used

- `.gitlab/duo/agent-config.yml` and custom flow YAML: nothing here needs a custom flow yet.
- AI Catalog `SKILL` items: the catalog has an item type for skills. Repo skills are simpler and work everywhere, so they're the source.
