---
name: sheds-store-design-system
description: The sheds.store visual design system - brand colours, the fluid Oswald + Source Sans 3 type scale, buttons, header and footer, shed cards and tags, the auth frame, the dashboard (app-chrome) token set, city-page tokens, dark mode, and layout rules - with the Tailwind class or CSS variable for each. Use when styling any sheds.store page or component, choosing colours or type sizes, building a new widget that must look native to sheds.store, reviewing UI for consistency, or producing a design file, mockup or Claude Design system for sheds.store.
---

# sheds.store design system

The source of truth is code in `sheds.store-new`:

| What | File |
| --- | --- |
| Brand colours, type scale | `src/config/theme.json` (read by `tailwind.config.cjs`) |
| Base element styles | `src/assets/styles/base.scss` |
| Marketplace buttons | `src/assets/styles/buttons.scss` |
| Header, nav links, Sign In button | `src/assets/styles/navigation.scss` |
| Footer | `src/layouts/partials/footer.astro` |
| Listing page (`/sheds`): tokens, cards, tags, filters | `src/assets/styles/sheds-browse.scss` (`--sb-*`, `.sb-*`) |
| Home hero and featured sheds | `src/pages/index.astro`, `src/components/astro/home_zip_search.astro`, `src/components/astro/home_featured_sheds.astro` |
| Sign in, sign up, forgot password | `src/assets/styles/auth.scss` (`.auth-*`) |
| Dashboard tokens and components | `src/assets/styles/dashboard.scss` (`--dash-*`, `.dash-*`) |
| City and variant page tokens | `src/assets/styles/_city-tokens.scss` |
| City page (`/location/<city>`) layout | `src/assets/styles/locations.scss`, `city-pages.scss` |
| Webfonts | `src/assets/styles/fonts.scss`, files in `public/fonts/` |

Some pages keep their styles in a scoped `<style>` block in the `.astro` file, for example the plan cards in `src/pages/sell-a-shed.astro`.

`DESIGN.md` in this skill is the portable summary for design tools. `references/tokens.json` has the same values as data. If the code and these files disagree, the code wins. Fix the file in this plugin.

## Voice

Industrial and outdoors: warehouse signage over a cream, paper-like background. Condensed capitals for display headings, a plain humanist sans for reading, one deep forest green for actions and links, and a warm tan/gold as the brand accent.

## Logo and favicons

Use the real logo. Never type "SHEDS.STORE" in Oswald as a stand-in wordmark, and never redraw the barn.

| File in this skill | What it is | Use on |
| --- | --- | --- |
| `assets/brand/logo.svg` | Barn mark over the wordmark, brown `#6e4716` and green `#45843b`, 161×92 | White, cream and other light backgrounds |
| `assets/brand/logo-on-dark.svg` | Same, with the roof and wordmark white | The green footer, dark mode, photos |
| `assets/brand/mark.svg` | Barn mark only, 161×67 | Tight spaces: app chrome, avatars, loaders |
| `assets/brand/favicon.ico` | 16, 32 and 48px | `rel="icon"` |
| `assets/brand/favicon-32.png`, `favicon-192.png` | PNG icons | `rel="icon"` with `sizes` |
| `assets/brand/apple-touch-icon.png` | 180×180, opaque | `rel="apple-touch-icon"` |

The site serves the same files from `public/`: `/favicon.ico`, `/favicon-32.png`, `/favicon-192.png`, `/apple-touch-icon.png`, and the header and footer logos as `/images/logo.png` and `/images/footer_logo.png`. The vector logo is `public/images/favicon.svg` (the name is misleading: it's the full logo, not an icon). Inside the repo, link the `public/` paths. Copy from this skill only for work outside the repo, such as a prototype or artifact.

The head tags `base.astro` uses, which a stand-alone page should repeat:

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

- The logo links home and has `alt="Sheds.Store"`. Don't add "logo" to the alt text.
- Show it at 53.5px high in the header (`config.site.logo_height`), with its width following. Never stretch it.
- Brown `#6e4716` and green `#45843b` belong to the logo. They aren't UI colours, so don't use them for buttons or text.

## Colour

Use the Tailwind names. Every colour needs its `dark:` counterpart.

| Role | Light | Dark | Tailwind |
| --- | --- | --- | --- |
| Page background | `#fafafa` + `/images/body-bg.svg` | `#2a2b2c` | `bg-body dark:bg-theme-dark` |
| Card on dark | | `#393b3d` | `dark:bg-card-dark` |
| Body text | `#272727` | `#fdfaf7` | `text-text dark:text-text-dark` |
| Long-form text | `#17252A` | `#fffffc` | `text-content dark:text-content-dark` |
| Headings | `#222` | `#fdfaf7` | `text-dark dark:text-text-dark` |
| Brand accent (tan) | `#D4AA75` | `#8a7354` | `bg-primary dark:bg-primary-dark` |
| Brand accent, bright on dark | | `#f3d9b7` | `dark:text-primary-bright-dark` |
| Brand green (actions, links) | `#004627` | `#234737` | `bg-secondary dark:bg-secondary-dark` |
| Border | `#cbcbcb` | | `border-border` |
| Alert / sold | `#ff735c` | | `border-border-secondary`, `bg-sold` |
| Light surface | `#F1F1F1`, `#E3E3E3` | | `bg-surface`, `bg-surface-secondary` |

There's also a green ramp as CSS variables, `--green-900` (`#004627`) down to `--green-30` (`#f4f9ed`), in `base.scss`.

Tan on cream is low-contrast. Don't set body-size text in `#D4AA75` on a light background. Use the green, `--gold-700` (`#8a5d1d`) on city pages, `--sb-accent` (`#9a6b2f`) on the listing page, or `$auth-link` (`#a9783a`) on auth pages.

### Contrast

Text needs 4.5:1 against its background (3:1 at 24px, or 19px bold). Borders, focus rings and icons need 3:1. These are the pairs that come up, measured:

| Pair | Ratio | Use |
| --- | --- | --- |
| White on tan `#d4aa75` | 2.1:1 | **Fails.** The live site's tan buttons do this. Don't copy it. |
| `#222` (`text-dark`) on tan | 7.4:1 | Text on any tan fill: buttons, the search cap, pills |
| Tan text on white | 2.1:1 | **Fails.** Use `--sb-accent` `#9a6b2f` (4.7:1) or `--gold-700` `#8a5d1d` (5.7:1) |
| White on forest green `#004627` | 11:1 | Hero and footer text, green buttons |
| White on `bg-green-600` | 3.3:1 | **Fails** at badge size. Use `bg-green-700` (5.0:1). |
| White on `bg-amber-500` | 2.2:1 | **Fails.** Use `text-dark` on amber (7.4:1) |
| White at 40–50% opacity on dark green cards | 2.7–3.4:1 | **Fails.** Use `text-white/80` or more |
| Forest green focus ring on a dark card | 1.2:1 | **Invisible.** Use a tan ring in dark mode (6.1:1) |
| Placeholder `#6b7280` on a dark input | 2.3:1 | **Fails.** Give placeholders and input affixes (`$`, `%`) their own `dark:` colour, for example `dark:placeholder:text-text-dark/70` |

Dark-mode pairs fail more often than light ones, because a `dark:` variant is easy to leave out. Check both themes.

Dark mode is off for visitors. `.dark` goes on `<html>` only when `localStorage.theme` is `"dark"`, and the `<ThemeToggle />` in the header is commented out. There's no `prefers-color-scheme` fallback. Keep writing the `dark:` pairs anyway, so the toggle can come back without a restyle.

## Type

Two families, both self-hosted variable fonts:

| Family | Use | Tailwind |
| --- | --- | --- |
| Oswald (200–700) | Headings, big figures, card titles | `font-secondary` |
| Source Sans 3 (200–900) | Everything else | `font-primary` (the body default) |

`h1`–`h3` are Oswald **bold uppercase**. `h4`–`h6` are Oswald semibold, sentence case. Don't use weights above 700 on Oswald.

Every size is fluid between 375px and 1280px viewports. There are no mobile `-sm` variants:

| Class | Phone → desktop | Leading |
| --- | --- | --- |
| `text-h1` | 32 → 48px | 1.15 |
| `text-h2` | 26 → 36px | 1.15 |
| `text-h3` | 22 → 28px | 1.15 |
| `text-h4` | 19 → 22px | 1.25 |
| `text-h5` | 17 → 19px | 1.25 |
| `text-h6` | 16 → 17px | 1.25 |
| `text-base` | 16 → 18px | 1.6 |
| `text-small` | 14 → 15px | 1.5 |
| `text-base-fixed` | 16px, not fluid | 1.5 |

Use `text-base-fixed` for dense tables and controls that must not grow. Long-form copy uses `prose`, which is wired to the same scale and capped at `max-w-measure` (66ch).

Pages that break the heading rule on purpose:

| Page | Heading | Why it differs |
| --- | --- | --- |
| Home hero | "Shed Marketplace" | `capitalize` (title case), white, with "Buy" and "Sell" either side split by white rules |
| `/sheds` | "Sheds for sale" | `.sb-display` (Oswald 700 caps) at `clamp(1.625rem, 1.2rem + 1.9vw, 2.375rem)`, 26 → 38px, not `text-h1` |
| City hero | "Sheds for sale in Fort Wayne, *Indiana* …" | Oswald caps with one `<em>` in italic Georgia, `--gold-400`, not uppercased |

## Buttons (marketplace)

Pill shaped, 46px high, 14px semibold:

| Class | Use |
| --- | --- |
| `btn btn-primary` | Main action. Tan fill. The class sets white text, which fails contrast (2.1:1), so new work adds `text-dark` (7.4:1). |
| `btn btn-outline-primary` | Secondary action. 2px tan border. Tan text fails on white, so use `text-sb-accent` (4.7:1). |
| `btn btn-white` | On a light card. |
| `btn btn-outline-white` | On a dark or photo background. |
| `btn-sm` | Compact modifier, 38px. |

Other buttons in use:

| Class | Where | Look |
| --- | --- | --- |
| `.btn-signin` | Header | Tan pill, 13px semibold, white text |
| `.nav-link-btn` | Header, "Sell a Shed" | White, `rounded-lg` (not a pill), tan text, pulsing tan ring (`cta-pulse`) |
| `.plan-button` | `/sell-a-shed` plan cards | Full-width tan pill, 14px bold, dark `text-content` text |
| `.btn-hero-primary` | City hero | `--gold-500` pill, `--on-gold` text, 15px semibold |
| `.btn-hero-secondary` | City hero | Transparent pill, white text, `rgba(255,255,255,0.32)` border |
| `.auth-submit` | Sign in form | `btn btn-primary`, full width |

## Header and footer

- `.header` is sticky, `bg-white/90` with `backdrop-blur-md`. A script adds `.header-sticky` (hairline and soft shadow) once the page scrolls past 4px.
- Logo left, then `.nav-link-btn` "Sell a Shed", `.nav-link` items (14px medium, `text-dark/75`, tan on hover with a `primary/10` wash), a pill ZIP search ("Find Local Sheds"), and `.btn-signin`.
- Below `lg` the links collapse behind a hamburger and the logo centres.
- The footer is forest green (`bg-secondary dark:bg-secondary-dark`). Column titles are uppercase `h6` in `text-footer_title` (`#ebebeb`). Column links and copy are `text-footer` (`#cbcbcb`), tan on hover. The city link grid is `text-white/65`, white on hover.
- Auth pages drop both. They use their own frame (see below).

## Home hero

A full-bleed illustrated shed yard tinted forest green. Centred white type: "Welcome", then the Buy | Shed Marketplace | Sell row, then "Local Sheds Near You". Under it sits the ZIP search: a long pill with a translucent field and a tan "SEARCH" end cap. Four white feature cards with tan line icons overlap the hero's bottom edge.

Section titles on the home page are Oswald caps, centred, with a short two-part tan underline.

## Shed cards

There are two. Don't mix their parts.

| Part | Listing card (`/sheds`) | Featured card (home) |
| --- | --- | --- |
| Source | `.sb-card` in `sheds-browse.scss`, `shed_card_item.vue` | `home_featured_sheds.astro` |
| Frame | White, 1px `--sb-line` border, 16px radius, deeper shadow on hover | No frame. `rounded-xl` photo, text below |
| Photo | 4:3, photo-count pill bottom right | Square swiper with dots and arrows, contact button bottom right |
| Title | `.sb-card__title`, Oswald caps 17px, one line | Oswald caps |
| Price | `.sb-price`, Oswald 700 24px, green; cash on the left, rent-to-own split by a hairline | Cash "OR" monthly, with "+ Tax" under each |
| Tags | `.sb-tag` pills (below) | `ShedFeatureBadges` pills |
| Status | `.sb-tag--used`, `--pending`, `--sold` | `rounded-md` 11px uppercase labels: `bg-green-600` "$X off", `bg-amber-500` used, `bg-yellow-500` pending, `bg-red-500` sold. White text on the green and amber fails contrast; new badges use `bg-green-700` with white, and amber or yellow with `text-dark`. |

`.sb-card--sponsored` marks paid placement: a `#fdf6ea` tint and a tan border.

### Listing tags

`.sb-tag` is an 11px bold pill. The default is `--sb-cream` (`#f4eadc`) with ink text.

| Modifier | Background | Text |
| --- | --- | --- |
| `--save` | `#e2f1e7` | `#0b5a34` |
| `--used` | `#e3ecfb` | `#23467f` |
| `--pending` | `#fdf0cf` | `#7a5a0c` |
| `--sold` | `#fbe3e1` | `#9b2c26` |
| `--hot` | `#d6331f` | white |
| `--popular` | `#e4eee6` | `#1f7a47` |

### Listing page chrome

- Category chips (`.sb-chip`) are 36px pills with a `--sb-line` border. `.is-active` fills green.
- The Grid / List / Map switch is a segmented pill on cream.
- The filter panel is a cream (`--sb-cream`) rounded panel with Oswald "FILTERS", letter-spaced caps labels, green range sliders, and tan-bordered checkboxes.
- All of it reads from the `--sb-*` variables on `.sb`. `.dark .sb` redefines them.

## Auth pages (`auth.sheds.store`)

- A green brand panel (`.auth-aside`, `secondary`) on the left from `lg`: logo tile, Oswald caps title, and an illustration card. Below `lg` it becomes a 5px green rule above a single column.
- The form column is white. Title is `.auth-title`: Oswald bold caps, `$auth-ink` (`#222`). Labels are `.auth-label`, 13px semibold. Inputs are `.form-control` with a `$auth-line` (`#e6e6e6`) border that turns tan on focus.
- Links use `$auth-link` (`#a9783a`), a darker tan that reads on white.
- Auth and dashboard pages open behind `.page-loader`: a `<shed-loader>` animation on `#f7f5f0` (`#03492a` in dark mode). It stays up at least 2s and CSS removes it after 8s if the script fails.

## Shed builder (`/build-shed`)

A 3D canvas on the left, a green "Customize Build" accordion on the right (Oswald option titles, current value right-aligned), and a toolbar pill at the bottom of the canvas. The primary action is a full-width green pill ("View Summary & Checkout"). The tutorial modal uses a green progress bar, a numbered green step circle and a green "Next" pill. While it loads it shows the green shed icon with "Starting the shed builder…".

## Dashboard (`dashboard.sheds.store`)

The dashboard has its own palette on `body.app-chrome`. Use the `.dash-*` classes there, not the marketplace ones:

- Layout: `.dash-app`, `.dash-side`, `.dash-main`, `.dash-head`, `.dash-section`
- Surfaces: `.dash-card`, `.dash-card-title`, `.dash-card-sub`, `.dash-tile`, `.dash-banner`, `.dash-empty`, `.dash-skel` (loading)
- Controls: `.dash-btn` with `--primary` (green), `--outline`, `--dark`, `--gold`, `--sm`; `.dash-field`, `.dash-input`, `.dash-help`, `.dash-pill`
- Tokens: `--dash-bg #f6f3ed`, `--dash-surface #fff`, `--dash-line #e9e3d8`, `--dash-ink #1d1c19`, `--dash-body #4a4740`, `--dash-muted #8a8377`, `--dash-green #004627`, `--dash-gold #d2a46b`, `--dash-red #b4402f`, `--dash-radius 14px`

Green means actionable, gold means needs attention, red means destructive or an error.

## City and variant pages

They load `_city-tokens.scss`: a tan ramp (`--tan-*`), amber (`--amber-*`), a dark forest hero palette (`--forest-*`, `--gold-*`), `--radius: 6px`, and `--font-serif` (Georgia) for section headings and pull quotes. Headings on the serif voice opt out of uppercase. Import the tokens partial in any stylesheet that uses these variables. An undefined custom property fails silently.

## Layout

- Page width: `.container` (centred, `max-w-[1302px] px-3`). Vertical rhythm: `.section` (`py-16`).
- Grid: `tailwind-bootstrap-grid` is installed (`row`, `col-*`), and plain Tailwind grid/flex works too. For a new grid, prefer one that wraps by itself, `grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]`, over a column count per breakpoint.
- Breakpoints: `sm 576`, `md 768`, `lg 992`, `xl 1200`, `2xl 1400`, `3xl 1600`. They're fine where the surrounding page already uses them. A port can keep its `sm:`/`md:` classes. Don't rewrite them in the same MR.
- Forms get `@tailwindcss/forms` base styles. Select carets are drawn in `_city-tokens.scss`; don't override `background` on a `select`.
- Icons are inline SVG with `stroke="currentColor"`, in `src/components/icons/`. A FontAwesome 3 webfont still ships in the CSS. Don't use it for new icons.

## Accessibility

Target WCAG 2.2 AA. The rules that sheds.store work most often breaks:

- **Contrast**, in both themes. See the table above.
- **Text colour**: the component's root sets its own colour (`text-text dark:text-text-dark`) rather than inheriting `body`. A host page or an artifact wrapper can set a body colour that turns inherited text black on dark.
- **Focus**: every control shows `focus-visible:outline-2 focus-visible:outline-offset-2` in a colour with 3:1 against its surroundings. That's `outline-secondary` in light mode and `dark:outline-primary` in dark. On a forest green surface (heroes, the footer, the auth panel) a green ring disappears, so use `outline-white` there. Never remove an outline without replacing it.
- **Labels**: every input has a `<label for>`. Placeholders are examples, not labels. Hints go in an element named by `aria-describedby`. Group related inputs in a `<fieldset>` with a `<legend>`.
- **Input affixes** such as `$` and `%` get `aria-hidden="true"`, and the label says the unit ("Monthly rent ($)"), so screen readers don't hear a bare "dollar".
- **Results that update** as someone types go in one `aria-live="polite"` region holding the summary sentence, not on every figure.
- **Charts**: wrap the SVG in a `<figure>` with a `<figcaption>` that states the takeaway, give it `role="img"` and an `aria-label`, and offer the numbers as a `<table>` with a `<caption>` and `<th scope>`. Never use colour alone to tell series apart; vary the dash pattern or add a label.
- **Touch targets** are at least 24×24px, including carousel dots and close buttons.
- **Structure**: one `<h1>`, headings in order with no skipped levels, and content inside `<header>`, `<main>` and `<footer>`. `base.astro` provides the landmarks. A stand-alone page needs `<html lang="en">` and its own landmarks.
- **Motion**: anything that pulses or slides (such as `cta-pulse`) stops under `prefers-reduced-motion: reduce`.
- **Text size**: 12px is the smallest. The 11px tags and chart ticks should be 12px in new work.

Run `scripts/a11y-audit.ts` from the `sheds-store-frontend` skill (see its "Checks") on the page in light and dark. Then tab through it with the keyboard. axe catches about a third of real problems, so a clean run isn't the end of the check.

## Checklist for a new component

- Uses theme colours, not raw hex, apart from the documented CSS variables.
- Has `dark:` variants (marketplace) or uses `--dash-*` (dashboard).
- Passes contrast in light and dark, including placeholders, affixes and focus rings.
- Uses `text-h*` / `text-base` rather than fixed `text-[18px]` sizes.
- Buttons are `.btn-*` or `.dash-btn--*`, with `text-dark` on any tan fill.
- Uses the real logo files, never a typed wordmark.
- Every control has a label, a visible focus ring and a 24px target.
- Looks right at 375px wide and in dark mode.

## Screenshots

Captured from the live site on 2026-10-13 at 1600px wide. Click a thumbnail for the full image.

| Home | Listings (`/sheds`) | City page |
| --- | --- | --- |
| [<img src="assets/screenshots/home-desktop.png" width="300" alt="sheds.store home page: green illustrated hero with Buy, Shed Marketplace, Sell, a pill ZIP search with a tan Search button, four white feature cards, and featured shed cards">](assets/screenshots/home-desktop.png) | [<img src="assets/screenshots/sheds-listing.png" width="300" alt="Sheds for sale listing page: category chips, cream filter panel with green sliders, and a grid of white shed cards with green prices and tag pills">](assets/screenshots/sheds-listing.png) | [<img src="assets/screenshots/city-page.png" width="300" alt="Fort Wayne city page: dark forest hero with Oswald capitals, an italic gold serif Indiana, gold and outline pill buttons, a stats panel, and dealer cards with serif names">](assets/screenshots/city-page.png) |
| **Sell a shed** | **Sign in** | **Shed builder** |
| [<img src="assets/screenshots/sell-a-shed.png" width="300" alt="Sell a shed page: green hero with Save time. Sell more sheds., then three plan cards, the middle one forest green, each with a tan pill button">](assets/screenshots/sell-a-shed.png) | [<img src="assets/screenshots/signin.png" width="300" alt="Dealer sign in: green brand panel with an illustrated red shed on the left, white form column with Oswald Sign In title, two inputs and a tan pill Sign In button">](assets/screenshots/signin.png) | [<img src="assets/screenshots/build-shed.png" width="300" alt="3D shed builder: shed model on the left, green Customize Build accordion on the right, and a tutorial modal with a green step circle and Next button">](assets/screenshots/build-shed.png) |

<details>
<summary>Home page at 390px (phone)</summary>

<img src="assets/screenshots/home-phone.png" width="390" alt="sheds.store home page on a phone: centred logo with a hamburger menu, the hero text stacked smaller, the ZIP search pill, and feature cards in one column">

</details>

<details>
<summary>Shed builder loading state</summary>

<img src="assets/screenshots/build-shed-loading.png" width="600" alt="Shed builder loading: green outline shed icon on a tan base above Starting the shed builder in Oswald, on the cream page background">

</details>
