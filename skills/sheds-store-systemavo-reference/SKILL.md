---
name: sheds-store-systemavo-reference
description: Orientation for the repos in gitlab.com/davidbodnar that are NOT sheds.store - Maybach (Laravel + Livewire), SystemAvo (CodeIgniter), and the PHP shed-brand marketing sites. Use when a task lands in a davidbodnar/cth repo, when deciding which repo owns a piece of behaviour, or to avoid applying sheds.store conventions where they don't belong.
---

# Not sheds.store: Maybach, SystemAvo and the brand sites

The `davidbodnar/cth` subgroup holds SystemAvo's products: Maybach (dealer and shed ERP), SystemAvo (the older ERP), and the shed-brand marketing sites. They're different codebases with different stacks from sheds.store. **Don't apply sheds.store conventions there** (Astro, Vue islands, Supabase clients), and don't bring theirs into sheds.store.

**The repo map, which repo is current, how each one deploys, and how they share data are in `docs/agents/related-repos.md` and `docs/agents/repo-map.svg` in your sheds.store-new clone.** Read them before working outside sheds.store-new or deciding which repo owns a behaviour. Without a clone, say what you can't see and ask.

## Stacks at a glance

| Product | Stack |
| --- | --- |
| Maybach | Laravel, Livewire + Volt, Jetstream, WireUI, Tailwind + daisyUI, Alpine, Vite. Pest, pint, phpstan. |
| SystemAvo | CodeIgniter, PHP, MySQL |
| Brand sites | Plain PHP templates |

Versions are in each repo's `composer.json` and `package.json`. Read them there; don't assume.

## Working in one of these repos

- Read the repo's own `AGENTS.md` / `CLAUDE.md` first and follow it. It wins over this plugin.
- Many repos in the subgroup are older copies, one-off tooling or placeholders. Ask before working in one or citing it as how things work today.
- Maybach ↔ sheds.store integration: see `sheds-store-maybach-contract`.
- Laravel's own agent tooling: Laravel Boost (`composer require laravel/boost --dev`, `php artisan boost:install`) and `laravel/agent-skills`.
