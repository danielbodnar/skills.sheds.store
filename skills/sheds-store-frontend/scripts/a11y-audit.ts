#!/usr/bin/env bun
/**
 * Run axe-core (WCAG 2.2 A and AA rules) against pages in headless Chromium,
 * once with prefers-color-scheme: light and once with dark.
 *
 * Usage:
 *   bun <skill dir>/scripts/a11y-audit.ts <url>... [--serve <dir>] [--json <file>]
 *
 *   <url>          a page to audit. With --serve, a path such as `/` is resolved
 *                  against the local server.
 *   --serve <dir>  serve <dir> on a random local port first (for built sites and
 *                  saved prototypes).
 *   --json <file>  also write every violation, with all affected nodes, to <file>.
 *
 * Needs `playwright-core` and `axe-core` resolvable, plus a Chromium that
 * playwright-core can launch (set CHROMIUM_PATH to use a system one). Neither is
 * a dependency of this repo; point NODE_PATH at existing installs, e.g.
 *   NODE_PATH=$(mise where playwright)/node_modules:$HOME/.cache/.bun/install/global/node_modules
 *
 * Exits 1 when any page has a violation. Passing doesn't make a page accessible:
 * axe catches roughly a third of WCAG failures. Check keyboard order and a
 * screen reader by hand too.
 */
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, join, normalize, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");
const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");

const args = process.argv.slice(2);
const take = (flag: string) => {
  const i = args.indexOf(flag);
  return i > -1 ? args.splice(i, 2)[1] : undefined;
};
const serveDir = take("--serve");
const jsonOut = take("--json");
if (args.length === 0) {
  console.error("usage: bun a11y-audit.ts <url>... [--serve <dir>] [--json <file>]");
  process.exit(2);
}

const TYPES: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain",
};
let base = "";
if (serveDir) {
  const root = resolve(serveDir);
  const server = Bun.serve({
    port: 0,
    async fetch(req) {
      let path = normalize(decodeURIComponent(new URL(req.url).pathname));
      if (path.endsWith("/")) path += "index.html";
      const file = Bun.file(join(root, path));
      if (!(await file.exists())) return new Response("not found", { status: 404 });
      return new Response(file, { headers: { "content-type": TYPES[extname(path)] ?? "application/octet-stream" } });
    },
  });
  base = `http://localhost:${server.port}`;
}

type Violation = { id: string; impact: string; help: string; nodes: { target: string[]; failureSummary: string }[] };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const report: { url: string; scheme: string; violations: Violation[] }[] = [];
for (const arg of args) {
  const url = base && arg.startsWith("/") ? base + arg : arg;
  for (const scheme of ["light", "dark"] as const) {
    const page = await browser.newPage({ colorScheme: scheme, viewport: { width: 1440, height: 1000 } });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: axeSource });
    const result = await page.evaluate(() =>
      // @ts-expect-error axe is injected above
      axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } }),
    );
    await page.close();
    const violations = result.violations as Violation[];
    report.push({ url: arg, scheme, violations });
    console.log(`\n${arg} (${scheme}): ${violations.length ? `${violations.length} rule(s) failed` : "no violations"}`);
    for (const v of violations) {
      console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`);
      for (const n of v.nodes.slice(0, 3)) {
        console.log(`      ${n.target.join(" ")}`);
        const why = n.failureSummary.split("\n").slice(1).join(" ").trim();
        if (why) console.log(`        ${why.slice(0, 220)}`);
      }
    }
  }
}
await browser.close();
if (jsonOut) await writeFile(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
process.exit(report.some((r) => r.violations.length) ? 1 : 0);
