// Behaviour for skills.sheds.store: tabs, copy buttons, the skills accordion
// toggle, and the file viewer on skill pages. Each part is a no-op on pages
// that don't have its elements.
document.body.classList.replace("no-js", "js");

// Tabs, per tablist, following the ARIA tabs pattern.
for (const list of document.querySelectorAll('[role="tablist"]')) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = (tab, focus = true) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    }
    if (focus) tab.focus();
  };
  for (const t of tabs) {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(t);
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(tabs[(next + tabs.length) % tabs.length]);
    });
  }
}

// Copy buttons on every command block.
for (const block of document.querySelectorAll(".cmd")) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy";
  button.textContent = "Copy";
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(block.querySelector("code").textContent);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Select and copy";
    }
    setTimeout(() => (button.textContent = "Copy"), 1500);
  });
  block.append(button);
}

// Expand or collapse every skill on the landing page.
const toggle = document.querySelector(".toggle");
toggle?.addEventListener("click", () => {
  const open = toggle.dataset.open !== "true";
  for (const d of document.querySelectorAll(".skills details")) d.open = open;
  toggle.dataset.open = String(open);
  toggle.textContent = open ? "Collapse all" : "Expand all";
});

// File viewer on skill pages: one pane per file, chosen by the URL hash.
const files = [...document.querySelectorAll(".file")];
if (files.length) {
  const byPath = new Map(files.map((f) => [f.dataset.path, f]));
  const links = [...document.querySelectorAll(".tree a")];
  const pathLabel = document.querySelector(".viewer-path");
  const viewButtons = [...document.querySelectorAll(".view-toggle button")];
  let view = "rendered";

  const applyView = (file) => {
    const rendered = file.querySelector(".rendered");
    const source = file.querySelector(".source");
    const canRender = Boolean(rendered);
    for (const b of viewButtons) {
      b.disabled = !canRender && b.dataset.view === "rendered";
      b.setAttribute("aria-pressed", String((canRender ? view : "source") === b.dataset.view));
    }
    if (rendered) rendered.hidden = view !== "rendered";
    if (source) source.hidden = canRender && view === "rendered";
  };

  const show = (path) => {
    const file = byPath.get(path) ?? byPath.get("SKILL.md") ?? files[0];
    for (const f of files) f.hidden = f !== file;
    for (const a of links) a.setAttribute("aria-current", String(a.dataset.path === file.dataset.path));
    if (pathLabel) pathLabel.textContent = `/${file.dataset.path}`;
    applyView(file);
  };

  for (const b of viewButtons) {
    b.addEventListener("click", () => {
      view = b.dataset.view;
      show(decodeURIComponent(location.hash.slice(1)));
    });
  }

  // Relative links inside a rendered file open the linked file in the viewer.
  document.querySelector(".viewer").addEventListener("click", (e) => {
    const a = e.target.closest(".rendered a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (/^[a-z]+:|^#|^\//i.test(href)) return;
    const from = a.closest(".file").dataset.path.split("/").slice(0, -1);
    const parts = [...from];
    for (const seg of href.split("#")[0].split("/")) {
      if (seg === "..") parts.pop();
      else if (seg && seg !== ".") parts.push(seg);
    }
    const target = parts.join("/");
    if (!byPath.has(target)) return;
    e.preventDefault();
    location.hash = encodeURIComponent(target).replaceAll("%2F", "/");
  });

  addEventListener("hashchange", () => show(decodeURIComponent(location.hash.slice(1))));
  show(decodeURIComponent(location.hash.slice(1)));
}
