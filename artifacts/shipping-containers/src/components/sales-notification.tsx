import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Box, X, Zap } from "lucide-react";
import {
  useGetSalesNotifications,
  getGetSalesNotificationsQueryKey,
  type SaleNotification,
} from "@workspace/api-client-react";
import { useMarket } from "@/contexts/market";
import { isEligibleSale, isSalesPopupBlockedPath, resolvePublicImage, formatPurchaseDate } from "@/lib/sales-notifications";

const FIRST_DELAY_MS = 8_000;
const SHOW_MS = 7_000;
const GAP_MS = 30_000;
const RETRY_MS = 5_000;
const MAX_IMPRESSIONS = 3;
const STORAGE_KEY = "builtbox-sales-popup";

type SessionState = { shown: number[]; dismissed: boolean };

function readSession(): SessionState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { shown: [], dismissed: false };
    const p = JSON.parse(raw) as Partial<SessionState>;
    return {
      shown: Array.isArray(p.shown) ? p.shown.filter(n => typeof n === "number") : [],
      dismissed: p.dismissed === true,
    };
  } catch {
    return memorySession;
  }
}

let memorySession: SessionState = { shown: [], dismissed: false };
function writeSession(s: SessionState) {
  memorySession = s;
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* storage blocked */ }
}

function isTypingFocused(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  return ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName) || el.isContentEditable;
}

export function SalesNotification() {
  const { market } = useMarket();
  const [location] = useLocation();
  // Explicit, development-only samples: never enter the database or a production feed.
  const previewType = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get("salesPreview")
    : null;
  const isPreview = previewType === "container" || previewType === "genset";
  const [previewClosed, setPreviewClosed] = useState(false);
  const blocked = isSalesPopupBlockedPath(location);
  const [dismissed, setDismissed] = useState(() => readSession().dismissed);

  const { data, isError, isLoading } = useGetSalesNotifications({ country: market }, {
    query: {
      queryKey: getGetSalesNotificationsQueryKey({ country: market }),
      enabled: !dismissed && !isPreview,
      refetchInterval: 2 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 60 * 1000,
    },
  });

  const eligible = useMemo(() => {
    if (isError || isLoading || !Array.isArray(data)) return [];
    const now = Date.now();
    return data.filter(s => isEligibleSale(s, market, now));
  }, [data, market, isError, isLoading]);
  const eligibleRef = useRef(eligible);
  eligibleRef.current = eligible;
  const eligibleKey = eligible.map(s => s.id).join(",");

  const [current, setCurrent] = useState<SaleNotification | null>(null);
  const [delay, setDelay] = useState(FIRST_DELAY_MS);
  const [imgFailed, setImgFailed] = useState(false);

  // Reset on market change.
  useEffect(() => {
    setCurrent(null);
    setDelay(FIRST_DELAY_MS);
  }, [market]);

  useEffect(() => {
    if (isPreview) return;
    if (blocked || dismissed) { setCurrent(null); return; }
    if (current) {
      const t = window.setTimeout(() => { setCurrent(null); setDelay(GAP_MS); }, SHOW_MS);
      return () => window.clearTimeout(t);
    }
    if (!eligibleKey) return;
    const session = readSession();
    if (session.dismissed || session.shown.length >= MAX_IMPRESSIONS) return;
    let t = 0;
    const attempt = () => {
      if (document.hidden || isTypingFocused()) { t = window.setTimeout(attempt, RETRY_MS); return; }
      const s = readSession();
      if (s.dismissed || s.shown.length >= MAX_IMPRESSIONS) return;
      const next = eligibleRef.current.find(x => !s.shown.includes(x.id) && isEligibleSale(x, market, Date.now()));
      if (!next) return;
      writeSession({ ...s, shown: [...s.shown, next.id] });
      setImgFailed(false);
      setCurrent(next);
    };
    t = window.setTimeout(attempt, delay);
    return () => window.clearTimeout(t);
  }, [blocked, dismissed, current, eligibleKey, delay, market, isPreview]);

  const sale: SaleNotification | null = isPreview ? {
    id: 0,
    country: market,
    productType: previewType === "genset" ? "genset" : "container",
    productName: previewType === "genset" ? "Carrier Undermount Genset" : "20ft Modified Container",
    city: market === "CA" ? "Toronto" : "Houston",
    imagePath: previewType === "genset" ? "/images/genset-carrier.png" : "/images/product-20ft.png",
    purchasedAt: "2026-11-17T12:00:00Z",
  } : current;

  if (!sale || blocked || (isPreview ? previewClosed : (
    dismissed || !isEligibleSale(sale, market, Date.now())
    || !eligible.some(candidate => candidate.id === sale.id)
  ))) return null;

  const isGenset = sale.productType === "genset";
  const img = imgFailed ? null : resolvePublicImage(sale.imagePath, import.meta.env.BASE_URL ?? "/");
  const Icon = isGenset ? Zap : Box;

  const close = () => {
    if (isPreview) {
      setPreviewClosed(true);
      return;
    }
    writeSession({ ...readSession(), dismissed: true });
    setDismissed(true);
    setCurrent(null);
  };

  return (
    <aside
      aria-label={isPreview ? "Demo notification, not a real sale" : "Recent purchase"}
      data-testid="popup-sales-notification"
      className="fixed z-40 left-3 sm:left-5 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] w-[min(20rem,calc(100vw-6rem))] animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
    >
      <div className="relative flex gap-3 bg-card text-card-foreground border border-card-border border-l-4 border-l-primary shadow-[0_10px_30px_-12px_hsl(212_17%_15%/0.35)] p-3 pr-9">
        <div className="shrink-0 w-14 h-14 bg-muted flex items-center justify-center overflow-hidden">
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
          ) : (
            <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{isPreview ? "Demo — not a real sale" : "Recent purchase"}</p>
          <p className="text-sm font-semibold leading-snug truncate" data-testid="text-sale-product">{sale.productName}</p>
          <p className="text-xs text-muted-foreground truncate" data-testid="text-sale-location">
            {sale.city} / {sale.country === "CA" ? "Canada" : "United States"}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            {isPreview
              ? <span className="text-muted-foreground">Sample only</span>
              : <time dateTime={sale.purchasedAt} className="text-muted-foreground">{formatPurchaseDate(sale.purchasedAt, market)}</time>}
            <span aria-hidden="true" className="text-border">|</span>
            <Link
              href={isGenset ? "/gensets" : "/containers"}
              className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              data-testid="link-sale-view"
            >
              View {isGenset ? "gensets" : "containers"}
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close recent purchase notice"
          data-testid="button-close-sale"
          className="absolute top-1.5 right-1.5 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
