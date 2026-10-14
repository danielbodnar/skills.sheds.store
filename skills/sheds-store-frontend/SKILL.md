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
| Page shell | `src/layouts/base.astro` (marketplace), `auth.astro`, partials in `src/layouts/partials/` |
| Shared client state | `src/store/store.ts` (nanostores) |
| Pure helpers | `src/lib/utils/<name>.ts` |
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
| `client:load` | Needed immediately: search bar, auth forms, dashboard shell. |
| `client:only="vue"` | Can't render on the server (three.js, `window`-dependent libraries). Give it a sized placeholder so the layout doesn't jump. |

Props must be serializable: strings, numbers, booleans, plain objects, arrays. Fetch data in the page frontmatter on the server and pass it down. Don't fetch Supabase data in the island when the page could have rendered it.

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
- Copy pricing logic from the helpers named above, with a comment naming the source file. Don't invent formulas.

## Dark mode

`darkMode: "class"`. Every colour class needs its `dark:` pair, for example `bg-body dark:bg-theme-dark text-text dark:text-text-dark`. See `sheds-store-design-system`.

## Checks

- The build passes (`pnpm build`, or whatever the lockfile says).
- `pnpm preview` and load the page. Try it at phone width and with dark mode on.
- No `import React`, `.jsx`, or `.tsx` in the diff.
