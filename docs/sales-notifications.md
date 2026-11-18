# Verified sales notifications

The database starts empty. Nothing is seeded, and quote/contact submissions never create sales.
The public, read-only feed is `/api/sales-notifications?country=US` (or `CA`).
Only verified, display-approved purchases in the last 30 days are eligible. Future dates,
withdrawn sales and unverified records are excluded. Switching the site's country selector
switches the feed; this is not precise IP geolocation.

## Add completed purchases

### Private sales page

Visit `/admin/sales` to sign in, then add, edit, hide or approve genuine completed
purchases. New records are hidden by default. Verify the order/invoice first and
tick the completed-sale confirmation; entering an inquiry is not sufficient.
The public notifications never expose the private source reference.

Only the account whose **verified primary email** matches the server-only
`SALES_ADMIN_EMAIL` setting is authorized. There is no first-signup admin grant
and no role supplied by the browser. Every owner API request checks Clerk's
current user record; verification failure denies access. Do not put the owner
email in frontend code, fixtures, or this document.

Sign-in is at `/sign-in`, with account verification at `/sign-up`. Creating an
account does not grant owner access. The public website remains accessible
without sign-in, and private queries are cleared on sign-out/account changes.

For Vercel, configure the appropriate Clerk instance's server-only
`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and `SALES_ADMIN_EMAIL`, plus public
`VITE_CLERK_PUBLISHABLE_KEY` and the instance's required proxy configuration.
Production Clerk identities/settings are separate from development; do not
copy development accounts/IDs or assume Replit provisions Vercel settings.
Follow the provider's custom-domain setup for the actual production host.
Use the same approved owner identifier in the production setting, and verify
ownership there. No default/shared password is created.

The Clerk proxy is mounted before JSON parsing. Authentication middleware is
scoped to `/api/admin` so the existing public email/quote endpoints continue
working when admin keys are absent. Writes require a valid owner session and a
same-origin browser request; none are authenticated by a client role or hidden
URL. An absent configuration returns 503, anonymous requests return 401, and
signed-in non-owners return 403.

### Private shell import

Trusted operators can also use the project shell. No unauthenticated write endpoint
or shared admin password has been added.

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
