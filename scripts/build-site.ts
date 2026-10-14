#!/usr/bin/env bun
/**
 * Build the packages and the static site served at https://skills.sheds.store.
 *
 * Usage: bun scripts/build-site.ts [--base https://skills.sheds.store]
 *
 * Writes site/dist/ (deleted and rebuilt on each run):
 *   index.html                              landing page with install steps and downloads
 *   downloads/<name>.skill                  one per skill: a zip with <name>/SKILL.md at the root,
 *                                           for Customize > Skills in claude.ai, Desktop and Cowork
 *   plugins/sheds-store.zip                 the whole plugin, for Customize > Plugins
 *   .well-known/agent-skills/index.json     skills CLI discovery index (agentskills.io discovery 0.2.0)
 *   .well-known/agent-skills/<name>.tar.gz  one archive per skill, digest in the index
 *   marketplace.json                        Claude Code url marketplace; sheds-store is an archive source
 *   skills/<name>/                          a page per skill: file tree, rendered and source views,
 *                                           and the skill's files served raw beside it
 *   style.css, site.js                      shared by every page
 *   SHA256SUMS                              checksums for every download
 *   llms.txt, llms-full.txt                 Markdown index for agents (llmstxt.org), and every
 *                                           SKILL.md inlined in one file
 *
 * Env: MARKETPLACE_REPO, the GitHub repo (owner/repo) for the claude.ai "Add from a
 * repository" step. The step is left out when it isn't set.
 *
 * Archives come from `git archive HEAD`, so only committed content ships and the
 * same commit always produces the same digests. Commit before building. CI runs
 * this in the `package` job.
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { $ } from "bun";

const root = resolve(import.meta.dir, "..");
const out = join(root, "site/dist");
const baseArg = process.argv.indexOf("--base");
const base = (baseArg > -1 ? process.argv[baseArg + 1] : "https://skills.sheds.store").replace(/\/$/, "");

const sha256 = async (path: string) =>
  new Bun.CryptoHasher("sha256").update(await readFile(path)).digest("hex");

// Top-level `key: value` pairs, plus folded or literal block scalars
// (`key: >-` then indented lines), which some skills use for long
// descriptions. Block lines are joined with spaces.
function frontmatter(text: string): Record<string, string> {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  const out: Record<string, string> = {};
  let block: string | null = null;
  for (const line of m?.[1].split("\n") ?? []) {
    if (block && /^\s+\S/.test(line)) {
      out[block] = `${out[block]} ${line.trim()}`.trim();
      continue;
    }
    block = null;
    const kv = line.match(/^([a-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    if (/^[>|][+-]?$/.test(kv[2])) {
      block = kv[1];
      out[block] = "";
    } else {
      out[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

const escape = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

await rm(out, { recursive: true, force: true });
for (const dir of [".well-known/agent-skills", "downloads", "plugins"]) await mkdir(join(out, dir), { recursive: true });

const sums: string[] = [];
const record = async (path: string) => {
  const digest = await sha256(path);
  sums.push(`${digest}  ${relative(out, path)}`);
  return digest;
};

// Per-skill packages: a .skill zip for upload and a tar.gz for the skills CLI.
const skills: { name: string; summary: string; description: string; tarDigest: string; skillDigest: string }[] = [];
const names = (await readdir(join(root, "skills"), { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
for (const name of names) {
  const { description } = frontmatter(await readFile(join(root, "skills", name, "SKILL.md"), "utf8"));
  const tar = join(out, ".well-known/agent-skills", `${name}.tar.gz`);
  const skill = join(out, "downloads", `${name}.skill`);
  // The skills CLI wants SKILL.md at the archive root; .skill zips keep the folder.
  await $`git -C ${root} archive --format=tar.gz -o ${tar} HEAD:skills/${name}`;
  await $`git -C ${root} archive --format=zip --prefix=${name}/ -o ${skill} HEAD:skills/${name}`;
  skills.push({
    name,
    description,
    summary: description.split(" - ")[0].split(". ")[0],
    tarDigest: await record(tar),
    skillDigest: await record(skill),
  });
}
await writeFile(
  join(out, ".well-known/agent-skills/index.json"),
  `${JSON.stringify(
    {
      $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
      skills: skills.map((s) => ({
        name: s.name,
        description: s.description,
        type: "archive",
        url: `${s.name}.tar.gz`,
        digest: `sha256:${s.tarDigest}`,
      })),
    },
    null,
    2,
  )}\n`,
);

// The whole plugin as a zip of HEAD, minus repo-only files.
const zipPath = join(out, "plugins/sheds-store.zip");
await $`git -C ${root} archive --format=zip -o ${zipPath} HEAD -- . ${[":!site", ":!specs", ":!.gitlab-ci.yml", ":!.rumdl.toml", ":!.gitignore"]}`;
const zipSha = await record(zipPath);

// Claude Code url marketplace: same catalog, with sheds-store as an archive.
const catalog = JSON.parse(await readFile(join(root, ".claude-plugin/marketplace.json"), "utf8"));
catalog.plugins = catalog.plugins.map((p: { name: string; source: unknown }) =>
  p.name === "sheds-store"
    ? { ...p, source: { source: "archive", url: `${base}/plugins/sheds-store.zip`, sha256: zipSha } }
    : p,
);
await writeFile(join(out, "marketplace.json"), `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(join(out, "SHA256SUMS"), `${sums.sort((a, b) => a.slice(66).localeCompare(b.slice(66))).join("\n")}\n`);

// llms.txt (https://llmstxt.org): a Markdown index of the site for agents. Skill
// links point at the raw SKILL.md served beside each skill page, not the HTML.
// llms-full.txt inlines every SKILL.md, frontmatter removed, for one-fetch reads.
const llms = `# sheds.store skills

> Agent skills, rules and MCP config for building sheds.store, the shed marketplace at https://sheds.store: Astro on one Cloudflare Worker, Vue islands, Tailwind and Supabase. It installs as the \`sheds-store\` plugin (Claude Code, claude.ai, Codex, VS Code, Copilot, Gemini) or skill by skill with the skills CLI.

Start with the \`sheds-store\` skill. It covers the product and the stack, and says which skill to load next.

Install for Claude Code:

\`\`\`sh
claude plugin marketplace add ${base}/marketplace.json
claude plugin install sheds-store@sheds-store
\`\`\`

Install for any agent the skills CLI supports:

\`\`\`sh
bunx skills@latest add ${base} --all
\`\`\`

Account IDs, secret locations and the Maybach integration details aren't published here. They're in the sheds.store-new repo under \`docs/agents/\`, and the skills say which file to read.

## Skills

${skills.map((s) => `- [${s.name}](${base}/skills/${s.name}/SKILL.md): ${s.description}`).join("\n")}

## Install files

- [marketplace.json](${base}/marketplace.json): Claude Code marketplace, with the plugin as a checksummed archive
- [Skills discovery index](${base}/.well-known/agent-skills/index.json): what \`skills add\` reads
- [sheds-store.zip](${base}/plugins/sheds-store.zip): the whole plugin, for claude.ai Customize > Plugins

## Optional

- [llms-full.txt](${base}/llms-full.txt): every SKILL.md in one file
- [SHA256SUMS](${base}/SHA256SUMS): checksums for every download
`;
await writeFile(join(out, "llms.txt"), llms);
const full = await Promise.all(
  skills.map(async (s) => {
    const body = (await $`git -C ${root} show HEAD:skills/${s.name}/SKILL.md`.text()).replace(/^---\n[\s\S]*?\n---\n/, "");
    return `<skill name="${s.name}" source="${base}/skills/${s.name}/SKILL.md">\n\n> ${s.description}\n${body.trimEnd()}\n\n</skill>`;
  }),
);
await writeFile(
  join(out, "llms-full.txt"),
  `# sheds.store skills: full text\n\n> Every SKILL.md from ${base}, built from ${(await $`git -C ${root} rev-parse --short HEAD`.text()).trim()}. Files a skill references (references/, assets/) are linked, not inlined: fetch them from the skill's source URL.\n\n${full.join("\n\n")}\n`,
);

// Landing page.
const commit = (await $`git -C ${root} rev-parse --short HEAD`.text()).trim();
// claude.ai adds marketplaces only from a GitHub repository or git URL. It reads
// private GitHub repos the user can access, not private GitLab ones. The step is
// left out unless MARKETPLACE_REPO (owner/repo) is set.
const marketplaceRepo = process.env.MARKETPLACE_REPO?.trim() ?? "";
const repoStep = marketplaceRepo
  ? `        <li>The marketplace: <strong>Customize &gt; Plugins &gt; Add marketplace &gt; Add from a repository</strong>, then enter <code>${escape(marketplaceRepo)}</code> and turn on <strong>Sync automatically</strong>. Your Claude account needs access to that repo.</li>`
  : "";
const items = skills
  .map(
    (s) => `    <details>
      <summary><span class="skill-name">${escape(s.name)}</span><span class="skill-summary">${escape(s.summary)}.</span></summary>
      <div class="skill-body">
        <p>${escape(s.description)}</p>
        <div class="skill-links"><a class="browse" href="skills/${escape(s.name)}/">Browse files</a><a class="chip" href="downloads/${escape(s.name)}.skill" download>Download ${escape(s.name)}.skill</a><span class="note">sha256 <code>${s.skillDigest.slice(0, 12)}…</code></span></div>
      </div>
    </details>`,
  )
  .join("\n");
const html = await readFile(join(root, "site/index.template.html"), "utf8");
await writeFile(
  join(out, "index.html"),
  html
    .replaceAll("{{BASE}}", escape(base))
    .replace("{{SKILL_ITEMS}}", items)
    .replace("{{REPO_STEP}}", repoStep)
    .replace("{{ZIP_SHA}}", zipSha)
    .replace("{{COMMIT}}", commit)
    .replace("{{COUNT}}", String(skills.length)),
);

// Shared assets for every page. The favicons and logo come from the design-system
// skill, so the site and the skill can't drift apart.
for (const asset of ["style.css", "site.js"]) await writeFile(join(out, asset), await readFile(join(root, "site", asset)));
const brand = "skills/sheds-store-design-system/assets/brand";
for (const asset of ["favicon.ico", "favicon-32.png", "favicon-192.png", "apple-touch-icon.png", "logo-on-dark.svg"]) {
  await writeFile(join(out, asset), new Uint8Array(await $`git -C ${root} show HEAD:${brand}/${asset}`.quiet().arrayBuffer()));
}

// Skill pages at /skills/<name>/: a file tree, a viewer with rendered Markdown
// and source, and every file of the skill served raw beside the page, so
// relative links and images resolve. Content comes from HEAD, like the archives.
type Tree = { files: string[]; dirs: Map<string, Tree> };
const renderTree = (tree: Tree, prefix = ""): string => {
  const items = [
    ...tree.files.map((name) => {
      const path = prefix + name;
      return `<li><a href="#${escape(path)}" data-path="${escape(path)}" title="${escape(path)}">${escape(name)}</a></li>`;
    }),
    ...[...tree.dirs].map(([dir, sub]) => `<li><span class="dir">${escape(dir)}</span>${renderTree(sub, `${prefix}${dir}/`)}</li>`),
  ];
  return `<ul>${items.join("")}</ul>`;
};
const TEXT = /\.(md|txt|json|ya?ml|toml|ts|js|mjs|sh|nu|css|html|svg)$/i;
const IMAGE = /\.(png|jpe?g|gif|webp|svg)$/i;
const skillTemplate = await readFile(join(root, "site/skill.template.html"), "utf8");
for (const s of skills) {
  const prefix = `skills/${s.name}/`;
  const paths = (await $`git -C ${root} ls-tree -r --name-only HEAD ${prefix}`.text())
    .split("\n")
    .filter(Boolean)
    .map((p) => p.slice(prefix.length))
    .sort((a, b) => (a === "SKILL.md" ? -1 : b === "SKILL.md" ? 1 : a.localeCompare(b)));
  const dir = join(out, "skills", s.name);
  const tree: Tree = { files: [], dirs: new Map() };
  const panes: string[] = [];
  for (const path of paths) {
    const bytes = new Uint8Array(await $`git -C ${root} show HEAD:${prefix}${path}`.quiet().arrayBuffer());
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), bytes);

    const parts = path.split("/");
    let node = tree;
    for (const part of parts.slice(0, -1)) {
      if (!node.dirs.has(part)) node.dirs.set(part, { files: [], dirs: new Map() });
      node = node.dirs.get(part)!;
    }
    node.files.push(parts.at(-1)!);

    const attr = `class="file" data-path="${escape(path)}" hidden`;
    if (!TEXT.test(path)) {
      const preview = IMAGE.test(path) ? `<img src="${escape(path)}" alt="${escape(path)}">` : "";
      panes.push(`<div ${attr}><div class="rendered">${preview}<p><a href="${escape(path)}" download>Download ${escape(path)}</a></p></div></div>`);
      continue;
    }
    const text = new TextDecoder().decode(bytes);
    // Code blocks scroll sideways when they're wide, so they take focus:
    // keyboard users then scroll them with the arrow keys (WCAG 2.1.1).
    const rendered = path.endsWith(".md")
      ? `<div class="rendered">${Bun.markdown.html(text.replace(/^---\n[\s\S]*?\n---\n/, ""))
          .replaceAll("<pre>", '<pre tabindex="0">')
          // A "- [ ]" checklist in a doc is a list, not a form. Disabled, unlabeled
          // checkboxes would be announced as nine dead controls, so draw the box instead.
          .replace(/<input type="checkbox" class="task-list-item-checkbox"( checked)? disabled>/g, (_, on) =>
            `<span class="task-box${on ? " done" : ""}" aria-hidden="true"></span>`)}</div>`
      : "";
    panes.push(`<div ${attr}>${rendered}<div class="source"><pre tabindex="0"><code>${escape(text)}</code></pre></div></div>`);
  }
  const others = skills
    .filter((o) => o.name !== s.name)
    .map((o) => `        <li><a href="/skills/${escape(o.name)}/">${escape(o.name)}</a></li>`)
    .join("\n");
  await writeFile(
    join(dir, "index.html"),
    skillTemplate
      .replaceAll("{{NAME}}", escape(s.name))
      .replaceAll("{{BASE}}", escape(base))
      .replaceAll("{{COMMIT}}", commit)
      .replace("{{SUMMARY}}", escape(`${s.summary}.`))
      .replace("{{DESCRIPTION}}", escape(s.description))
      .replace("{{TREE}}", renderTree(tree))
      .replace("{{FILES}}", panes.join("\n"))
      .replace("{{FILE_COUNT}}", String(paths.length))
      .replace("{{SKILL_SHA}}", `${s.skillDigest.slice(0, 16)}…`)
      .replace("{{OTHERS}}", others),
  );
}

console.log(
  `Built ${skills.length} .skill files, ${skills.length} skill archives, marketplace.json and sheds-store.zip ` +
    `(sha256 ${zipSha.slice(0, 12)}…) from ${commit} into site/dist`,
);
