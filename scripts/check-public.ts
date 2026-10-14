#!/usr/bin/env bun
/**
 * Fail if a tracked file holds something that belongs in sheds.store-new's
 * private docs/agents/ instead of this publishable plugin.
 *
 * Usage: bun scripts/check-public.ts
 *
 * Two kinds of check:
 * - Patterns for identifier shapes and generic phrases (account IDs, emails,
 *   "no auth"). These are safe to publish, so they live here.
 * - Private names (Workers, buckets, secret names, the vault). The list isn't
 *   in this repo in any form. It comes from CHECK_PUBLIC_NAMES: the base64 of
 *   a newline-separated list, kept as a masked CI/CD variable and in
 *   sheds.store-new docs/agents/check-public-names.txt. Locally:
 *     export CHECK_PUBLIC_NAMES=$(base64 -w0 < ../sheds.store-new/docs/agents/check-public-names.txt)
 *   Without it, the name check is skipped with a warning.
 *
 * Prints file:line and the rule for each hit, and exits 1 if there are any.
 * Run by `bun run validate` and in CI.
 *
 * When a check fires: move the fact to the matching file in sheds.store-new
 * docs/agents/ and point the skill at that file. Don't weaken a rule to make a
 * hit pass.
 */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";

const root = resolve(import.meta.dir, "..");

type Rule = { name: string; pattern: RegExp };

// Git SHAs (40 hex) and sha256 digests (64 hex) don't match the 32-hex rule:
// there's no word boundary inside them.
const PATTERNS: Rule[] = [
  { name: "Cloudflare account or zone ID", pattern: /\b[0-9a-f]{32}\b/ },
  { name: "1Password ID", pattern: /\b(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{26}\b/ },
  { name: "GitLab global ID", pattern: /gid:\/\/gitlab\/[\w:]+\/\d+/ },
  { name: "Supabase project ref", pattern: /project_ref=|\b[a-z]{20}\.supabase\.co\b/ },
  { name: "Cloudflare Access team domain", pattern: /[a-z0-9-]+\.cloudflareaccess\.com/ },
  // Skips the `git@host` user in SSH remotes; still catches bare `@domain` mentions.
  { name: "Email address", pattern: /(?<![\w.%+-])(?!git@)[a-z0-9._%+-]*@[a-z0-9-]+\.[a-z0-9.-]*[a-z]{2,}/i },
  { name: "Unauthenticated endpoint note", pattern: /\bno auth\b|\bunauthenticated\b/i },
  { name: "Shared merchant", pattern: /merchant (is )?shared|shared .{0,30}merchant/i },
  { name: "Production layout", pattern: /production runs|runs production/i },
];

const encoded = process.env.CHECK_PUBLIC_NAMES?.trim();
const names = encoded
  ? new Set(
      Buffer.from(encoded, "base64")
        .toString("utf8")
        .split("\n")
        .map((n) => n.trim().toLowerCase())
        .filter((n) => n && !n.startsWith("#")),
    )
  : null;
if (!names) console.warn("check-public: CHECK_PUBLIC_NAMES isn't set, so private names aren't checked");

const SELF = "scripts/check-public.ts";
const BINARY = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|zip|gz|tgz|pdf)$/i;
const files = (await $`git -C ${root} ls-files`.text())
  .split("\n")
  .filter((f) => f && f !== SELF && !BINARY.test(f));
const hits: string[] = [];

for (const file of files) {
  let text: string;
  try {
    text = await readFile(join(root, file), "utf8");
  } catch {
    continue; // deleted in the working tree
  }
  text.split("\n").forEach((line, i) => {
    for (const rule of PATTERNS) {
      if (rule.pattern.test(line)) hits.push(`${file}:${i + 1}: ${rule.name}`);
    }
    if (!names) return;
    for (const raw of line.toLowerCase().split(/[^a-z0-9_.-]+/)) {
      const word = raw.replace(/^[.-]+|[.-]+$/g, "");
      if (word && names.has(word)) hits.push(`${file}:${i + 1}: private name`);
    }
  });
}

if (hits.length) {
  console.error(hits.join("\n"));
  console.error(`\n${hits.length} private detail(s). Move them to sheds.store-new docs/agents/.`);
  process.exit(1);
}
console.log(`check-public: ${files.length} files clean${names ? `, ${names.size} private names checked` : ""}`);
