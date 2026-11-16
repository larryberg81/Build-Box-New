// Vercel loads the checked, precompiled API rather than recompiling workspace
// TypeScript with a different configuration. This entry never starts a listener.
export { default } from "../artifacts/api-server/dist/app.mjs";
