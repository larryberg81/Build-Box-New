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

Deploy a precompiled JavaScript Express application to Vercel, while retaining strict TypeScript checks on the original source.

**Why:** Repeated deployments passed the local NodeNext check and frontend build, but failed in Vercel's additional function compiler on successive Express type-inference errors. Compiling the application with the existing API bundler avoids that inconsistent second TypeScript compilation without disabling source typechecking.

**How to apply:** Keep Vercel's adapter JavaScript-only and point it at the compiled application, not the listener-based server entry. Build the API before Vercel packages the function, include its logger worker files, and validate the actual adapter in production mode without PORT. Inspect the end of the real Vercel build log and check the live API before claiming deployment or email success.
