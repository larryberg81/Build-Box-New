# Verified sales notifications

The database starts empty. Nothing is seeded, and quote/contact submissions never create sales.
The public, read-only feed is `/api/sales-notifications?country=US` (or `CA`).
Only verified, display-approved purchases in the last 30 days are eligible. Future dates,
withdrawn sales and unverified records are excluded. Switching the site's country selector
switches the feed; this is not precise IP geolocation.

## Add completed purchases

Trusted operators use the project shell, not an unauthenticated website form. No new public
write endpoint or admin password has been added.

1. Verify the completed sale against your order/invoice system.
2. Prepare a private JSON array containing only these fields:
   - `sourceReference`: unique internal order/invoice reference (not sent to visitors).
   - `country`: `US` or `CA`.
   - `productType`: `container` or `genset`.
   - `productName`: product display name.
   - `city`: city only, no street address.
   - `purchasedAt`: actual ISO purchase timestamp with timezone, never a fabricated "just now".
   - `imagePath`: optional `/images/your-existing-product-photo.webp` (PNG/JPG also accepted).
   - `verified`: explicitly `true`.
   - `displayApproved`: explicitly `true` only when appropriate to show publicly.
3. Run:

   ```
   pnpm --filter @workspace/db sales import /absolute/path/to/sales.json --confirm-completed-sales
   pnpm --filter @workspace/db sales list
   pnpm --filter @workspace/db sales hide RECORD_ID
   ```

All rows validate before writing; an import is transactional. Re-importing the same source
reference updates that sale rather than creating another. Do not change its purchase date to
make an old purchase appear recent. To withdraw a purchase, use `hide` or reimport it with
`displayApproved: false`. Do not add names, emails, phone numbers, delivery addresses, or
test purchases. Do not commit sales files to Git.

## Database and Vercel

Development schema is declared in `lib/db/src/schema/sales.ts`; apply with
`pnpm --filter @workspace/db push`. This is a development operation, not a deploy hook.

The Vercel API needs a server-only `DATABASE_URL` pointing to the intended persistent PostgreSQL
database with this schema. Do not copy development credentials into chat or commit them.
An external production database's schema must be applied separately against the confirmed
target; Replit publishing does not migrate a Vercel database. No database creation or schema
migration runs at application startup or during the Vercel build.

Without a working sales database, the feed returns 503 and the popup stays hidden. Existing
email, quote and health routes continue working without `DATABASE_URL`. An empty configured
database returns `[]`. The feed uses no-store so withdrawn records are not cached by the API.
The client refreshes periodically and must not persist purchase claims across sessions.

Tests insert fixture rows only inside a rolled-back database transaction; no test purchase
is committed or visible to other connections:

```
pnpm --filter @workspace/db test:sales
```
