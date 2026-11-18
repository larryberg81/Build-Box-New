import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useClerk, useUser } from "@clerk/react";
import {
  useGetAdminSession, getGetAdminSessionQueryKey,
  useGetAdminSales, getGetAdminSalesQueryKey,
  useCreateAdminSale, useUpdateAdminSale, useSetAdminSaleVisibility,
  getGetSalesNotificationsQueryKey,
  type AdminSale, type SaleInput,
} from "@workspace/api-client-react";
import { SaleForm } from "@/components/admin/sale-form";
import { SaleList } from "@/components/admin/sale-list";
import { describeError, errorStatus } from "@/components/admin/sale-utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Notice = { tone: "ok" | "err"; text: string } | null;

function Panel({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-8 text-center animate-in fade-in duration-300" role="status" data-testid="status-panel">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse bg-muted" />)}
    </div>
  );
}

const btn = "border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary";

export default function AdminSalesPage() {
  const qc = useQueryClient();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [editing, setEditing] = useState<AdminSale | "new" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [countryF, setCountryF] = useState<"all" | "US" | "CA">("all");
  const [typeF, setTypeF] = useState<"all" | "container" | "genset">("all");
  const [signingOut, setSigningOut] = useState(false);

  const session = useGetAdminSession({ query: { queryKey: getGetAdminSessionQueryKey(), retry: false } });
  const isAdmin = session.data?.isAdmin === true;
  const sales = useGetAdminSales({ query: { queryKey: getGetAdminSalesQueryKey(), enabled: isAdmin, retry: false } });
  const createSale = useCreateAdminSale();
  const updateSale = useUpdateAdminSale();
  const setVis = useSetAdminSaleVisibility();

  const filtered = useMemo(
    () => (sales.data ?? []).filter((s) => (countryF === "all" || s.country === countryF) && (typeF === "all" || s.productType === typeF)),
    [sales.data, countryF, typeF],
  );

  async function invalidate() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getGetAdminSalesQueryKey() }),
      qc.invalidateQueries({ queryKey: getGetSalesNotificationsQueryKey() }),
    ]);
  }

  async function submit(data: SaleInput) {
    setNotice(null);
    try {
      if (editing && editing !== "new") {
        await updateSale.mutateAsync({ id: editing.id, data });
        setNotice({ tone: "ok", text: `Sale #${editing.id} updated.` });
      } else {
        const s = await createSale.mutateAsync({ data });
        setNotice({ tone: "ok", text: `Sale #${s.id} added${s.displayApproved ? " and approved for display" : " as hidden"}.` });
      }
      setEditing(null);
      await invalidate();
    } catch (e) {
      setNotice({ tone: "err", text: describeError(e, "save the sale") });
    }
  }

  async function toggle(s: AdminSale) {
    setNotice(null);
    setPendingId(s.id);
    try {
      const r = await setVis.mutateAsync({ id: s.id, data: { displayApproved: !s.displayApproved } });
      setNotice({ tone: "ok", text: `Sale #${r.id} is now ${r.displayApproved ? "approved for display" : "hidden"}.` });
      await invalidate();
    } catch (e) {
      setNotice({ tone: "err", text: describeError(e, "change visibility") });
    } finally {
      setPendingId(null);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    qc.clear();
    await signOut({ redirectUrl: basePath || "/" });
  }

  const signInBtn = <a href={`${basePath}/sign-in`} className={btn} data-testid="link-sign-in">Sign in</a>;

  let body: React.ReactNode;
  if (session.isLoading) {
    body = <Panel title="Checking access" body="Verifying your owner account with the server." />;
  } else if (session.isError) {
    const st = errorStatus(session.error);
    body = st === 401
      ? <Panel title="Session expired" body="Sign in again to manage sales." action={signInBtn} />
      : st === 403
      ? <Panel title="Access denied" body="This account is not authorized for sales administration." />
      : <Panel title={st === 503 ? "Database unavailable" : "Could not verify access"} body={describeError(session.error, "verify access")} action={<button className={btn} onClick={() => session.refetch()} data-testid="button-retry-session">Retry</button>} />;
  } else if (!isAdmin) {
    body = <Panel title="Access denied" body="This account is not authorized for sales administration." />;
  } else if (editing) {
    body = <SaleForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? null : editing} pending={createSale.isPending || updateSale.isPending} onSubmit={submit} onCancel={() => setEditing(null)} />;
  } else if (sales.isLoading) {
    body = <Skeleton />;
  } else if (sales.isError) {
    const st = errorStatus(sales.error);
    body = <Panel title={st === 401 ? "Session expired" : st === 403 ? "Access denied" : st === 503 ? "Database unavailable" : "Could not load sales"} body={describeError(sales.error, "load sales")} action={st === 401 ? signInBtn : <button className={btn} onClick={() => sales.refetch()} data-testid="button-retry-sales">Retry</button>} />;
  } else if (!sales.data || sales.data.length === 0) {
    body = <Panel title="No sales recorded" body="When a real sale completes, record it here. Nothing appears publicly until you approve it." action={<button className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => setEditing("new")} data-testid="button-add-first">Add first sale</button>} />;
  } else {
    body = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="f-country" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country</label>
            <select id="f-country" value={countryF} onChange={(e) => setCountryF(e.target.value as typeof countryF)} className="border border-border bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary" data-testid="filter-country">
              <option value="all">All</option><option value="US">US</option><option value="CA">Canada</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-type" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</label>
            <select id="f-type" value={typeF} onChange={(e) => setTypeF(e.target.value as typeof typeF)} className="border border-border bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary" data-testid="filter-type">
              <option value="all">All</option><option value="container">Containers</option><option value="genset">Gensets</option>
            </select>
          </div>
          <span className="ml-auto text-sm text-muted-foreground" data-testid="text-count">{filtered.length} of {sales.data.length}</span>
        </div>
        {filtered.length === 0
          ? <Panel title="No matches" body="No sales match these filters." />
          : <SaleList sales={filtered} pendingId={pendingId} onEdit={setEditing} onToggle={toggle} />}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b-4 border-primary bg-foreground text-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-4">
          <div className="mr-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Built Box Containers</p>
            <h1 className="text-2xl font-semibold">Sales administration</h1>
          </div>
          {user && <span className="hidden text-xs opacity-70 sm:inline" data-testid="text-user">{user.primaryEmailAddress?.emailAddress}</span>}
          <button type="button" onClick={handleSignOut} disabled={signingOut} className="border border-background/30 px-3 py-1.5 text-sm font-semibold hover:bg-background/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary" data-testid="button-sign-out">
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        {isAdmin && !editing && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-auto max-w-xl text-sm text-muted-foreground">Only genuine completed sales. Public notifications show city, product and date, never buyer details. New records stay hidden until approved.</p>
            <button type="button" onClick={() => sales.refetch()} disabled={sales.isFetching} className={btn} data-testid="button-refresh">{sales.isFetching ? "Refreshing..." : "Refresh"}</button>
            <button type="button" onClick={() => { setNotice(null); setEditing("new"); }} className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" data-testid="button-add-sale">Add sale</button>
          </div>
        )}
        <div aria-live="polite">
          {notice && (
            <p className={`border-l-4 px-4 py-3 text-sm animate-in fade-in duration-200 ${notice.tone === "ok" ? "border-primary bg-primary/10" : "border-destructive bg-destructive/10 text-destructive"}`} role={notice.tone === "err" ? "alert" : "status"} data-testid="status-notice">{notice.text}</p>
          )}
        </div>
        {body}
      </main>
    </div>
  );
}
