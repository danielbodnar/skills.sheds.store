---
name: sheds-store-maybach-contract
description: The integration contract between sheds.store and Maybach (maybachsystems.com, the dealer management system run by SystemAvo) - the inventory feed, the shed builder API proxy, Google reviews, phone verification, the dealer waitlist and Quick Setup onboarding and billing. Use when changing Maybach inventory sync, the shed builder, /api/maybach/* routes, PUBLIC_MAYBACH_URL, Quick Setup, or anything where a change on one side could break the other. Not for general Maybach work - see sheds-store-systemavo-reference.
---

# sheds.store ↔ Maybach contract

Maybach (Laravel, repo `davidbodnar/cth/maybachsystems-com`) is a separate product. It owns dealer ERP, order and inventory data for several shed brands. sheds.store reads from it, and Maybach writes into sheds.store at a few defined points. Those points are the contract.

**The endpoints, how each side authenticates, what Maybach writes and where, and the Maybach-side code are in `docs/agents/maybach-contract.md` in your sheds.store-new clone.** Read it before you change anything below. Without a clone, say what you can't see and ask for access.

`PUBLIC_MAYBACH_URL` is the base URL.

## What crosses the boundary

| Feature | sheds.store side |
| --- | --- |
| Nightly inventory sync | `src/lib/server/maybachSync.ts`, from the 06:00 cron. It aborts a lot's sync if one run would remove more than 25% of its live stock. |
| Shed builder | `src/pages/api/shedbuilder/[endpoint].ts` proxies an allowlist of Maybach endpoints |
| Google reviews | `src/lib/server/googleReviews.ts` |
| Signup phone verification | Signup step 4, `googleVerification.ts` |
| Dealer waitlist | `src/pages/api/reserve-spot.astro` |
| Quick Setup | Maybach onboards a dealer onto sheds.store and starts billing. Routes under `src/pages/api/maybach/`. |

Product photos are served from Maybach's domain and allowed in `astro.config.mjs` `image.remotePatterns`.

## Rules

- Change either side only together with the other side's change in the same piece of work.
- A new shed builder endpoint needs adding to the allowlist on the sheds.store side and to Maybach.
- sheds.store decides plan prices (`src/lib/constants/billingPlans.ts`). Maybach sends a plan name, never a price.
- A schema change to the tables Quick Setup writes can break it. The tables are listed in the private doc. Check it before renaming or dropping a column.
- Treat Maybach responses as untrusted input. Validate shapes, and fail closed on money paths.
- Don't add new writes from Maybach into sheds.store without a sheds.store owner agreeing.

## When you change the contract

Say so in the MR description: which endpoint, which side, and whether the other side needs a matching MR. Link the other MR.
