import app from "../artifacts/api-server/src/app.js";

// Vercel serves the frontend statically, so forward /api/* requests to the
// same Express application used by the Replit API artifact.
export default app;
