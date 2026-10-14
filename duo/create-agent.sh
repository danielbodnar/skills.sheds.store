#!/bin/sh
# Create or update the "sheds.store engineer" custom agent in the GitLab AI Catalog.
#
# Usage: duo/create-agent.sh [--dry-run]
#
# Reads the system prompt from duo/system-prompt.md and the tool list from
# duo/agent-tools.txt. Creates the agent in project davidbodnar/sheds.store/skills
# with RESTRICTED visibility (usable across the davidbodnar group, hidden from
# Explore). A new agent is enabled in that project and in $ENABLE_IN. If an
# agent with the same name is already enabled there, it's updated instead.
# Needs glab authenticated to gitlab.com as a project Maintainer.
# aiCatalogAgentCreate is an Experiment API and may change.
set -eu

cd "$(dirname "$0")/.."
export GITLAB_HOST=gitlab.com

NAME="sheds.store engineer"
DESCRIPTION="Builds and reviews sheds.store (Astro + Vue islands + Tailwind + Supabase on Cloudflare Workers) using the sheds-store skills, and opens MRs into develop."
PROJECT_PATH="davidbodnar/sheds.store/skills"
# Other projects to enable a newly created agent in (space-separated).
ENABLE_IN="${ENABLE_IN:-davidbodnar/sheds.store/sheds.store-new}"

project_gid=$(glab api "projects/$(printf %s "$PROJECT_PATH" | jq -sRr @uri)" | jq -r '"gid://gitlab/Project/\(.id)"')

# Map tool names to built-in tool IDs.
tools_json=$(glab api graphql -f 'query=query { aiCatalogBuiltInTools(first: 100) { nodes { id name } } }' |
  jq --rawfile want duo/agent-tools.txt '
    ($want | split("\n") | map(select(length > 0 and (startswith("#") | not)))) as $names
    | [.data.aiCatalogBuiltInTools.nodes[] | select(.name as $n | $names | index($n)) | .id]')

missing=$(glab api graphql -f 'query=query { aiCatalogBuiltInTools(first: 100) { nodes { name } } }' |
  jq -r --rawfile want duo/agent-tools.txt '
    ([.data.aiCatalogBuiltInTools.nodes[].name]) as $have
    | $want | split("\n") | map(select(length > 0 and (startswith("#") | not))) | map(select(. as $n | $have | index($n) | not)) | .[]')
if [ -n "$missing" ]; then
  echo "Unknown tool names in duo/agent-tools.txt: $missing" >&2
  exit 1
fi

existing=$(glab api graphql -f "query=query { aiCatalogConfiguredItems(projectId: \"$project_gid\", itemTypes: [AGENT]) { nodes { item { id name } } } }" |
  jq -r --arg n "$NAME" '[.data.aiCatalogConfiguredItems.nodes[]?.item | select(.name == $n) | .id][0] // empty')

vars=$(jq -n --arg p "$project_gid" --arg name "$NAME" --arg desc "$DESCRIPTION" \
  --rawfile sys duo/system-prompt.md --argjson tools "$tools_json" --arg id "$existing" '
  if $id == "" then
    {input: {projectId: $p, name: $name, description: $desc, systemPrompt: $sys, tools: $tools, visibility: "RESTRICTED", release: true}}
  else
    {input: {id: $id, name: $name, description: $desc, systemPrompt: $sys, tools: $tools, visibility: "RESTRICTED", release: true}}
  end')

if [ "${1:-}" = "--dry-run" ]; then
  echo "$vars" | jq '.input | .systemPrompt |= (.[0:80] + "…")'
  exit 0
fi

if [ -z "$existing" ]; then
  mutation='mutation($input: AiCatalogAgentCreateInput!) { aiCatalogAgentCreate(input: $input) { item { id name } errors } }'
else
  mutation='mutation($input: AiCatalogAgentUpdateInput!) { aiCatalogAgentUpdate(input: $input) { item { id name } errors } }'
fi

result=$(jq -n --arg q "$mutation" --argjson v "$vars" '{query: $q, variables: $v}' |
  glab api graphql --input - -H 'Content-Type: application/json')
echo "$result" | jq .
item_id=$(echo "$result" | jq -r '.data[].item.id // empty')
[ -n "$item_id" ] || exit 1

# A new agent has to be enabled in a project before Chat offers it. The skills
# project is also where the lookup above finds it on the next run.
if [ -z "$existing" ]; then
  for path in $PROJECT_PATH $ENABLE_IN; do
    pid=$(glab api "projects/$(printf %s "$path" | jq -sRr @uri)" | jq -r '"gid://gitlab/Project/\(.id)"')
    jq -n --arg item "$item_id" --arg pid "$pid" '{
      query: "mutation($i: AiCatalogItemConsumerCreateInput!) { aiCatalogItemConsumerCreate(input: $i) { itemConsumer { id } errors } }",
      variables: {i: {itemId: $item, target: {projectId: $pid}}}}' |
      glab api graphql --input - -H 'Content-Type: application/json' | jq -c --arg p "$path" '{enabled_in: $p, errors: .data.aiCatalogItemConsumerCreate.errors}'
  done
fi
