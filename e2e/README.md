# Browser coverage (Playwright)

Runs against the **full compose stack** through nginx — the same origin a real
browser uses, so the httpOnly auth cookies behave as they do in production.

```bash
docker compose -f ../docker-compose.dev.yml up -d
npm run db:seed                   # from the repo root; runs inside the container
npm run test:e2e -w web-app
```

## Why this exists

The API suite proved 198 endpoints answer correctly. It could not have caught
what broke the app: the web-app's zod schemas required `_id`, the backend sends
`id`, and the client rejected every response. Login returned **200 with a valid
user** and the page silently sat on `/login`; the storefront rendered a perfect
shell around zero products.

Nothing in the backend was wrong. Nothing logged an error. Only a browser
driving the real client could see it.

So the assertions here are about **data arriving**, never about a page
responding:

- search results carry a price, and it is rupees not paise (the browser-side
  counterpart of the API money check)
- the orders list has orders — this customer has seeded history, so an empty
  list means a rejected response
- the owner dashboard shows a ₹ figure — that endpoint was a TypeError before
  PG-5, and "renders" is not the same as "answers"
- a customer hitting `/admin` gets Access denied *and* none of the admin
  navigation

## How it stays reliable

**One login per role per run.** `auth.setup.ts` signs in once and saves each
cookie jar; specs consume it via `storageState`. Not just for speed: login is
capped at 10 per email per 5 minutes, and a suite that logs in per test trips
that mid-run and then reports a throttle as a broken login.

**Preconditions come from the API, not from hope.** The seed randomises which
products a shop stocks and gives ~25% of variants no stock, so "search, click
the first card, add to cart" fails intermittently on an unlucky fixture and
looks like a broken button. `fixtures.ts` asks the API for something that
satisfies the precondition.

**The checkout journey clears the cart first.** Lines accumulate across runs,
and one that has gone out of stock makes placement refuse the whole order — the
API is right to refuse and names the items, but the test would be reporting a
stale fixture as a checkout bug.

**Re-seed after the API suite.** It writes, and one of its calls de-approves
the bench owner. `npm run test:stack` from the root sequences both correctly.
