---
name: sheds-store-frontend
description: How to build UI in sheds.store-new - Astro pages, Vue single-file components mounted as islands, client directives, nanostores, path aliases, Tailwind classes, and how to port a React component to Vue. Use when adding or changing a page, component, form, calculator, configurator, chart, modal, or any interactive widget on sheds.store, or when handed React/JSX code that needs to go into sheds.store.
---

# sheds.store frontend

Pages are `.astro` files rendered on the server. Anything interactive is a Vue single-file component (`.vue`) that the page mounts as an island. There's no React anywhere in the repo, and none gets added.

## Where things go

| Thing | Path |
| --- | --- |
| Route | `src/pages/<route>.astro` (file-based routing) |
| API route | `src/pages/api/<area>/<name>.ts`, exporting `GET`/`POST` as `APIRoute`, with `export const prerender = false` |
| Static or server-rendered component | `src/components/astro/<area>/<name>.astro` |
| Interactive component | `src/components/vue/<area>/<name>.vue` |
| Helpers only one component tree uses (drawing code, its API calls, UI classes) | Next to the components, in `src/components/vue/<area>/`, the way `shed-builder/` keeps `api.ts` and `diagram/` |
| Page shell | `src/layouts/base.astro` (marketplace), `auth.astro`, partials in `src/layouts/partials/`. `base.astro` takes `noindex` and `robots` props, so don't add your own robots meta. |
| Shared client state | `src/store/store.ts` (nanostores) |
| Pure helpers | `src/lib/utils/<name>.ts`. A large ported engine can keep its own folder (`src/lib/utils/<engine>/`) and stay in JS with JSDoc, so the port reads as a move. Write new code in TypeScript. |
| Server-only code | `src/lib/server/` (never import it from a `.vue` file) |
| Constants and copy | `src/lib/constants/` |
| Site config | `src/config/*.json` (`theme.json` holds colours and the type scale) |

File names are `snake_case.vue` / `snake_case.astro`. The component's `name` option is PascalCase.

Path aliases (from `tsconfig.json`): `@components/*`, `@layouts/*`, `@partials/*`, `@lib/*`, `@store/*`, `@config/*`, `@styles/*`, `@images/*`, `@icons/*`, `@middleware/*`, `@js/*`, and `@supabase/*`. Note that `@supabase/*` points at `src/supabase/`, not the npm scope. The npm client is imported as `@supabase/supabase-js`.

## Vue house style

The codebase uses the **Options API** in a plain `<script>` block. All recently added components follow it. Match it:

```vue
<template>
  <div class="dash-card">
    <h4 class="dash-card-title">{{ title }}</h4>
    <p v-if="total" class="text-base">{{ formatted }}</p>
  </div>
</template>

<script>
import { useStore } from "@nanostores/vue";
import { dashboardPlan } from "@store/store";

export default {
  name: "PlanSummary",
  props: {
    title: { type: String, required: true },
  },
  setup() {
    // nanostores are bound in setup() and used like data.
    return { plan: useStore(dashboardPlan) };
  },
  data() {
    return { total: 0 };
  },
  computed: {
    formatted() {
      return this.total.toLocaleString("en-US", { style: "currency", currency: "USD" });
    },
  },
};
</script>
```

`<script setup>` exists in a few older files. Don't convert files between styles in an unrelated MR.

Comments explain why, not what. The existing code is heavily commented about constraints ("this must not share a subrequest budget", "Oswald tops out at 700"). Keep that habit for non-obvious decisions.

## Mounting an island

```astro
---
import Base from "@layouts/base.astro";
import ShedPriceCalculator from "@components/vue/calculator/shed_price_calculator.vue";
---
<Base title="Shed price calculator" description="…" canonical="https://sheds.store/shed-price-calculator">
  <section class="section">
    <div class="container">
      <ShedPriceCalculator client:visible dealerId={dealerId} />
    </div>
  </section>
</Base>
```

Pick the directive by when the island must work:

| Directive | Use for |
| --- | --- |
| `client:visible` | Below-the-fold widgets: calculators, carousels, maps. The default choice. |
| `client:idle` | Above the fold but not needed on the first frame. |
| `client:load` | Needed immediately: search bar, auth forms, dashboard shell, and full-page tools where the island is the whole page (a planner or configurator). |
| `client:only="vue"` | Can't render on the server (three.js, `window`-dependent libraries). Give it a sized placeholder so the layout doesn't jump. |

Props must be serializable: strings, numbers, booleans, plain objects, arrays. Fetch data in the page frontmatter on the server and pass it down. Don't fetch Supabase data in the island when the page could have rendered it.

Data for one visitor is the exception. Anything derived from their ZIP, location or session goes through an `/api` route the island calls, never into the page HTML. Anonymous pages are cached at the edge, and one visitor's data in the HTML would be served to everyone (see the comment at the top of `src/pages/api/geo.ts`). The middleware leaves a route's own `Cache-Control` header alone, so the API route sets its own.

## Real data only

Shipped code never contains invented listings, dealers, prices, or calls to routes that don't exist. Ported prototypes often do. Replace each piece before the MR:

| Prototype has | Use |
| --- | --- |
| A demo inventory array | `getSearchShedsByLocationPaginated()` in `@lib/utils/convertData`. It already applies listing visibility (plan limits, hidden sold sheds) through `getShedsInLatBand()`. |
| A hard-coded dealer list | The dealer rows the inventory query returns, or a server-side query in the page frontmatter |
| A lead or contact form posting to a new route | `contact_dialog_lazy.vue`. Props: `open`, `dealer` (`{ id, dealership_name, rating, avatar }`), `product` (raw columns `{ id, width, height, shed_name, cash_price, image }`) and `defaultTab`. It writes the lead through `setDataToSupabase.ts`, which also calls `/api/leads/notify`. |
| A saved-session URL with nothing behind it | Remove it, or build the storage and API route in the same MR |

A shed's length is the `products.height` column, and it's a string. Read it as `parseFloat(shed.height)`, as `convertData.ts` does.

## Building a calculator or other interactive widget

1. Find the existing logic first. Rent-to-own: `getRtoOptions(dealer, cashPrice)` in `@lib/utils/productDetailHelpers`. The monthly payment is `cash / divider_N_length`, never `cash / months`. Same-as-cash labels: `sameAsCashLabel()` in `@lib/utils/dealerBadges`. Shed prices: `/api/shedbuilder/getShedPrice` (proxied to Maybach). Plan prices: `src/lib/constants/billingPlans.ts`.
2. Put the maths in a pure function in `src/lib/utils/` so it can be reused server-side (SEO-friendly static output, city pages) and checked without a browser.
3. Write the `.vue` component for input and display only. Format money with `toLocaleString("en-US", { style: "currency", currency: "USD" })`.
4. Mount it with `client:visible` from an Astro page. Render a sensible server-side default (the starting price, the default term) so the page reads correctly before hydration.
5. Style with Tailwind and the tokens in `sheds-store-design-system`. Forms already get `@tailwindcss/forms` base styles.
6. If it's a new public route, add it to `src/pages/sitemap.xml.ts` if that file lists routes explicitly.
7. Run the build.

## Porting React to Vue

| React | Vue (Options API) |
| --- | --- |
| `useState(x)` | `data() { return { x } }` |
| `useMemo(() => f(a), [a])` | `computed: { f() { … this.a … } }` |
| `useEffect(() => …, [a])` | `watch: { a() { … } }`, or `mounted()` for `[]` |
| props destructuring | `props: { … }`, read as `this.name` |
| `onChange={e => setX(e.target.value)}` | `v-model="x"` (`v-model.number` for numbers) |
| `{cond && <X/>}` | `<X v-if="cond" />` |
| `{items.map(i => <Li key={i.id}/>)}` | `<Li v-for="i in items" :key="i.id" />` |
| `className` | `class`, `:class="{ active: on }"` |
| children | `<slot />` |
| Context | a nanostore in `src/store/store.ts` |
| shadcn/Radix/MUI component | plain markup with Tailwind and the existing `.btn-*` / `.dash-*` classes |

Port the behaviour, not the file structure. Drop React-only dependencies from the change entirely. If the React version had business logic (pricing, terms, tax), check it against the helpers above before trusting it.

## Prototypes and artifacts outside the repo

A quick prototype (a claude.ai artifact, a single HTML file, a demo for review) follows the same rules, so it can move into the repo without a rewrite:

- Vue with the Options API, not React. Load Vue's ES module build from a CDN, so the component becomes an SFC by moving the code.
- Look up each library's current stable release when you write the file (`npm view vue version`, or the CDN's latest), and put that exact version in the URL. Never use a version from memory, and never one copied from an old example.
- Style with the design system: the tokens in `sheds-store-design-system` (`references/tokens.json`) as CSS variables, with Oswald and Source Sans 3. If you use Tailwind's in-browser build, take its current release and define the tokens in its theme.
- Use the real logo and favicons from `sheds-store-design-system` (`assets/brand/`), inlined or as data URIs if the page can't link files. Never type the name out as a wordmark.
- Meet the design system's accessibility rules in both themes. Set the root text colour explicitly: an artifact viewer wraps the page in its own `body` styles. Set `document.documentElement.lang = "en"` if you can't write the `<html>` tag yourself.
- Copy pricing logic from the helpers named above, with a comment naming the source file. Don't invent formulas.
- Sample data is fine in a prototype, but label it on the page ("sample prices"). It gets replaced before the code ships (see "Real data only").

## Dark mode

`darkMode: "class"`. Every colour class needs its `dark:` pair, for example `bg-body dark:bg-theme-dark text-text dark:text-text-dark`. See `sheds-store-design-system`.

## Accessibility

Follow "Accessibility" in `sheds-store-design-system`: contrast in both themes, labels on every input, visible focus, 24px targets, charts with a figure caption and a data table, one polite live region for results that update. Use native elements (`<button>`, `<details>`, `<dialog>`, `<table>`) before ARIA.

## Checks

- The build passes (`pnpm build`, or whatever the lockfile says).
- Load the built site. `astro preview` doesn't work with the Cloudflare adapter, so run the Worker instead: `pnpm build`, then `pnpm exec wrangler dev --local --port 8788`. `pnpm dev` works too, for quick checks.
- The build needs `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`. `src/supabase/index.ts` creates the client when the module loads, and `base.astro` imports it, so every page returns a 500 ("supabaseUrl is required") without them, even pages that never query. `docs/agents/secrets.md` in your sheds.store-new clone says where to get them.
- Try the page at phone width, and in light and dark. To see dark mode, run `localStorage.theme = "dark"` in the console and reload.
- Run the accessibility audit in this skill on the page. It checks light and dark, and exits non-zero on any WCAG 2.2 AA failure:

  ```sh
  bun "${CLAUDE_SKILL_DIR}/scripts/a11y-audit.ts" http://localhost:8788/your-page
  bun "${CLAUDE_SKILL_DIR}/scripts/a11y-audit.ts" / --serve ./prototype-dir
  ```

  It needs `playwright-core` and `axe-core`, which aren't sheds.store dependencies. If they aren't installed, ask before installing them. The script's header says how to point it at existing installs.
- Tab through the page with the keyboard. Every control should be reachable, with a visible focus ring.
- No `import React`, `.jsx`, or `.tsx` in the diff.
