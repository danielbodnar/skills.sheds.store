#!/usr/bin/env bun
/**
 * Check the plugin before it ships.
 *
 * Usage: bun scripts/validate.ts [--no-claude]
 *
 * Checks: every skills/<dir>/SKILL.md has frontmatter whose `name` equals the
 * directory and a `description` of 1-1024 characters; skills are flat (no
 * nested SKILL.md); manifests parse; versions in plugin.json and
 * gemini-extension.json agree; there's no top-level bin/ (claude.ai rejects it);
 * the two MCP files list the same servers; skills, agents and the Duo prompt
 * name no dependency versions; nothing private is in a tracked file
 * (scripts/check-public.ts). Then runs `claude plugin validate .` when the
 * claude CLI is on PATH, unless --no-claude is passed.
 *
 * Exits 1 on any failure.
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";

const root = resolve(import.meta.dir, "..");
const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

const json = async (rel: string) => {
  try {
    return JSON.parse(await readFile(join(root, rel), "utf8"));
  } catch (e) {
    fail(`${rel}: ${(e as Error).message}`);
    return {};
  }
};

function frontmatter(text: string): Record<string, string> | null {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const out: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z][\w-]*):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const skillsDir = join(root, "skills");
const dirs = (await readdir(skillsDir, { withFileTypes: true })).filter((d) => d.isDirectory());
for (const d of dirs) {
  const file = join(skillsDir, d.name, "SKILL.md");
  if (!existsSync(file)) {
    fail(`skills/${d.name}: no SKILL.md`);
    continue;
  }
  const fm = frontmatter(await readFile(file, "utf8"));
  if (!fm) fail(`skills/${d.name}/SKILL.md: missing frontmatter`);
  else {
    if (fm.name !== d.name) fail(`skills/${d.name}/SKILL.md: name "${fm.name}" doesn't match directory`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.name ?? "")) fail(`skills/${d.name}: name must be kebab-case`);
    const len = (fm.description ?? "").length;
    if (len < 1 || len > 1024) fail(`skills/${d.name}: description is ${len} chars (1-1024)`);
  }
  const nested = await Array.fromAsync(new Bun.Glob("*/**/SKILL.md").scan({ cwd: join(skillsDir, d.name) }));
  if (nested.length) fail(`skills/${d.name}: nested SKILL.md (${nested.join(", ")}); keep skills flat`);
}

if (existsSync(join(root, "bin"))) fail("top-level bin/ exists; claude.ai rejects plugins with one. Use scripts/.");

const claudePlugin = await json(".claude-plugin/plugin.json");
await json(".claude-plugin/marketplace.json");
const agentPlugin = await json("plugin.json");
const gemini = await json("gemini-extension.json");
if (claudePlugin.name !== agentPlugin.name || agentPlugin.name !== gemini.name) fail("plugin names differ across manifests");
if (agentPlugin.version !== gemini.version) fail(`version mismatch: plugin.json ${agentPlugin.version}, gemini-extension.json ${gemini.version}`);

const claudeMcp = Object.keys((await json(".mcp.json")).mcpServers ?? {}).sort().join(",");
const agentMcp = Object.keys((await json("mcp.json")).mcpServers ?? {}).sort().join(",");
if (claudeMcp !== agentMcp) fail(`.mcp.json and mcp.json list different servers: ${claudeMcp} vs ${agentMcp}`);

// Skills must not name dependency versions: agents copy them into prototypes,
// and a version written today is outdated, maybe vulnerable, tomorrow.
const VERSIONED = [
  /\b(astro|vue|react|tailwind(?:css)?|three(?:\.js)?|vite|node(?:\.js)?|bun|pnpm|laravel|php|livewire|codeigniter|typescript|wrangler|daisyui|alpine(?:\.js)?|jetstream|pest|mysql|postgres(?:ql)?|supabase|nanostores)\s+v?\d+(?:\.\d+)*\+?(?![\w%])/i,
  /(?:^|[\s"'(`/])@?[a-z][\w.-]*(?:\/[\w.-]+)?@[\^~]?\d+\.\d+/i,
  /\bv\d+\.[a-z0-9-]+\.(?:com|dev|org)\b/i,
];
const versionTargets = [
  ...(await Array.fromAsync(new Bun.Glob("skills/**/*.md").scan(root))),
  ...(await Array.fromAsync(new Bun.Glob("agents/*.md").scan(root))),
  "duo/system-prompt.md",
];
for (const rel of versionTargets) {
  const lines = (await readFile(join(root, rel), "utf8")).split("\n");
  lines.forEach((line, i) => {
    if (VERSIONED.some((re) => re.test(line))) fail(`${rel}:${i + 1} names a dependency version: ${line.trim().slice(0, 100)}`);
  });
}

const pub = await $`bun ${join(root, "scripts/check-public.ts")}`.nothrow();
if (pub.exitCode !== 0) fail("check-public found private details (listed above)");

if (!process.argv.includes("--no-claude") && Bun.which("claude")) {
  const r = await $`claude plugin validate ${root}`.nothrow();
  if (r.exitCode !== 0) fail("claude plugin validate failed");
}

if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}
console.log(`✓ ${dirs.length} skills, manifests and MCP config are valid`);
