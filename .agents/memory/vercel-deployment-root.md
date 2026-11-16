---
name: Vercel deployment root
description: Vercel dashboard root setting needed to deploy both the frontend and email API.
---

Use the repository root (leave Root Directory blank in Vercel) when deploying this website together with its email API.

**Why:** The Vercel dashboard was configured to use `artifacts/shipping-containers`. A deployment showed Ready and contained the API handler in Git, but the public API returned Vercel 404 because the handler was outside that deployment root. A successful static build alone does not verify email availability.

**How to apply:** Keep the frontend build command and output directory explicit in the repository-level Vercel configuration. The user confirmed clearing and saving the dashboard Root Directory on 2026-11-16. Code cannot change that external setting; recheck it if deployment scope changes. Verify API health after deployment before testing SMTP. Preserve the separate Replit development setup.

The Vercel function's TypeScript check must also pass with NodeNext module resolution, even though Replit's bundler accepts extensionless imports.

**Why:** Once the API was included, Vercel rejected imports that passed the original bundler-only typecheck. A frontend build and a Replit API bundle do not exercise that compiler mode.

**How to apply:** Maintain ESM-compatible relative imports and logger exports throughout the API's dependency tree. Preserve this compatibility when regenerating API schemas, and run the Vercel-specific API typecheck before deploying.

Treat the local NodeNext check as a useful guard, not an exact reproduction of Vercel's function compiler.

**Why:** A deployment passed that check and the frontend build, then failed in Vercel's subsequent function compilation on an Express router type.

**How to apply:** Inspect the end of the actual Vercel build log, including function compilation, before claiming a deployment build succeeds.
