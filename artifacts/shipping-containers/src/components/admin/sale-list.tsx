import type { AdminSale } from "@workspace/api-client-react";
import { formatDate, isStale } from "./sale-utils";

type Props = {
  sales: AdminSale[];
  pendingId: number | null;
  onEdit: (s: AdminSale) => void;
  onToggle: (s: AdminSale) => void;
};

function Tag({ tone, children }: { tone: "ok" | "warn" | "muted" | "bad"; children: React.ReactNode }) {
  const c = {
    ok: "bg-primary/10 text-primary border-primary/30",
    warn: "bg-amber-100 text-amber-900 border-amber-300",
    bad: "bg-destructive/10 text-destructive border-destructive/30",
    muted: "bg-muted text-muted-foreground border-border",
  }[tone];
  return <span className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${c}`}>{children}</span>;
}

export function SaleList({ sales, pendingId, onEdit, onToggle }: Props) {
  return (
    <ul className="divide-y divide-border border border-border bg-card" data-testid="list-sales">
      {sales.map((s) => {
        const stale = isStale(s.purchasedAt);
        const live = s.displayApproved && s.verified && !stale;
        const busy = pendingId === s.id;
        return (
          <li key={s.id} className="grid gap-3 p-4 transition-colors hover:bg-muted/40 sm:grid-cols-[1fr_auto] sm:items-center" data-testid={`row-sale-${s.id}`}>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-foreground px-1.5 py-0.5 font-mono text-[11px] font-bold text-background">{s.country}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.productType}</span>
                {live ? <Tag tone="ok">In public feed</Tag> : s.displayApproved ? <Tag tone="muted">Approved</Tag> : <Tag tone="muted">Hidden</Tag>}
                {!s.verified && <Tag tone="bad">Unverified</Tag>}
                {stale && <Tag tone="warn">Older than 30 days, not feed eligible</Tag>}
              </div>
              <p className="truncate font-semibold" data-testid={`text-product-${s.id}`}>{s.productName} <span className="font-normal text-muted-foreground">in {s.city}</span></p>
              <p className="text-xs text-muted-foreground">
                Completed {formatDate(s.purchasedAt)} · Ref <span className="font-mono">{s.sourceReference}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => onEdit(s)} className="flex-1 border border-border px-3 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary sm:flex-none" data-testid={`button-edit-${s.id}`}>Edit</button>
              <button type="button" onClick={() => onToggle(s)} disabled={busy || (!s.displayApproved && !s.verified)} aria-busy={busy} className={`flex-1 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 sm:flex-none ${s.displayApproved ? "border border-foreground/30 hover:bg-muted" : "bg-primary text-primary-foreground hover:bg-primary/90"}`} data-testid={`button-toggle-${s.id}`}>
                {busy ? "Updating..." : s.displayApproved ? "Hide" : "Show"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
