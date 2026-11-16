---
name: Vercel deployment root
description: Vercel dashboard root setting needed to deploy both the frontend and email API.
---

Use the repository root (leave Root Directory blank in Vercel) when deploying this website together with its email API.

**Why:** The Vercel dashboard was configured to use `artifacts/shipping-containers`. A deployment showed Ready and contained the API handler in Git, but the public API returned Vercel 404 because the handler was outside that deployment root. A successful static build alone does not verify email availability.

**How to apply:** Keep the frontend build command and output directory explicit in the repository-level Vercel configuration. Confirm the dashboard root was actually changed; code cannot change that external setting. Verify API health after deployment before testing SMTP. Preserve the separate Replit development setup.
