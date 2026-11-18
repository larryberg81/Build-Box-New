type ErrorType<T> = { status?: number; data?: T | null };

export const STALE_DAYS = 30;

export const IMAGE_CHOICES: { path: string; label: string }[] = [
  { path: "/images/container-20-hc-beige-angle.jpg", label: "20 ft high cube container" },
  { path: "/images/container-10-new-blue-side.jpg", label: "10 ft new container" },
  { path: "/images/container-10-new-gray-doors.jpg", label: "10 ft container, doors" },
  { path: "/images/blog-genset-guide.png", label: "Genset" },
];

export const IMAGE_PATH_RE = /^\/images\/[A-Za-z0-9_\-/]+\.(png|jpe?g|webp)$/i;

export function isStale(iso: string): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t > STALE_DAYS * 86400000;
}

export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function errorStatus(err: unknown): number | null {
  const s = (err as ErrorType<unknown> | null)?.status;
  return typeof s === "number" ? s : null;
}

export function describeError(err: unknown, action: string): string {
  const status = errorStatus(err);
  const data = (err as ErrorType<unknown> | null)?.data;
  let detail = "";
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const m = d.error ?? d.message;
    if (typeof m === "string") detail = m;
  } else if (typeof data === "string") detail = data.slice(0, 200);
  const base =
    status === 401 ? "Your session expired. Sign in again."
    : status === 403 ? "This account is not authorized for sales administration."
    : status === 503 ? "The sales database is unavailable right now."
    : status === 400 || status === 422 ? "The server rejected this input."
    : status === 404 ? "That sale no longer exists."
    : status ? `Request failed (HTTP ${status}).`
    : "Network error. Check your connection.";
  return `Could not ${action}. ${base}${detail ? ` ${detail}` : ""}`;
}
