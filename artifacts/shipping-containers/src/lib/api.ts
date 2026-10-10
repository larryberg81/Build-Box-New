// Leave blank on Replit to use its shared same-origin /api routing.
// For Vercel, set VITE_API_ORIGIN to the public origin serving the API artifact.
const API_ORIGIN = (import.meta.env?.VITE_API_ORIGIN ?? "").replace(/\/+$/, "");

export function apiUrl(path: `/api/${string}`): string {
  return `${API_ORIGIN}${path}`;
}
