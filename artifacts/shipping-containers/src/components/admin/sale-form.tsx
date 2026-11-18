import { useState } from "react";
import type { AdminSale, SaleInput } from "@workspace/api-client-react";
import { IMAGE_CHOICES, IMAGE_PATH_RE, toLocalInput } from "./sale-utils";

type Props = {
  initial: AdminSale | null;
  pending: boolean;
  onSubmit: (data: SaleInput) => Promise<void>;
  onCancel: () => void;
};

const field =
  "w-full border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function SaleForm({ initial, pending, onSubmit, onCancel }: Props) {
  const [sourceReference, setSourceReference] = useState(initial?.sourceReference ?? "");
  const [country, setCountry] = useState<"US" | "CA">(initial?.country ?? "US");
  const [productType, setProductType] = useState<"container" | "genset">(initial?.productType ?? "container");
  const [productName, setProductName] = useState(initial?.productName ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [dateLocal, setDateLocal] = useState(initial ? toLocalInput(initial.purchasedAt) : "");
  const [dateTouched, setDateTouched] = useState(false);
  const [imagePath, setImagePath] = useState(initial?.imagePath ?? "");
  const [verified, setVerified] = useState(initial?.verified === true);
  const [displayApproved, setDisplayApproved] = useState(initial?.displayApproved ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const maxLocal = toLocalInput(new Date().toISOString());

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const sr = sourceReference.trim(), pn = productName.trim(), c = city.trim(), img = imagePath.trim();
    if (!sr) errs.sourceReference = "Required."; else if (sr.length > 120) errs.sourceReference = "Max 120 characters.";
    if (!pn) errs.productName = "Required."; else if (pn.length > 160) errs.productName = "Max 160 characters.";
    if (!c) errs.city = "Required."; else if (c.length > 100) errs.city = "Max 100 characters.";
    let purchasedAt = "";
    if (initial && !dateTouched) purchasedAt = initial.purchasedAt;
    else {
      const d = new Date(dateLocal);
      if (!dateLocal || Number.isNaN(d.getTime())) errs.purchasedAt = "Enter the actual completion date and time.";
      else if (d.getTime() > Date.now() + 60000) errs.purchasedAt = "Date cannot be in the future.";
      else purchasedAt = d.toISOString();
    }
    if (img && (img.length > 300 || !IMAGE_PATH_RE.test(img)))
      errs.imagePath = "Use a local path like /images/name.jpg (png, jpg, webp; max 300).";
    if (!verified) errs.verified = "Confirm this is a genuine completed sale.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await onSubmit({
      sourceReference: sr, country, productType, productName: pn, city: c, purchasedAt,
      imagePath: img || null, verified: true, displayApproved,
    });
  }

  const err = (k: string) =>
    errors[k] ? <p id={`err-${k}`} role="alert" className="mt-1 text-xs font-medium text-destructive">{errors[k]}</p> : null;

  return (
    <form onSubmit={handle} noValidate className="space-y-5 border border-border bg-card p-5 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-300" data-testid="form-sale">
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-xl font-semibold">{initial ? `Edit sale #${initial.id}` : "Record a completed sale"}</h2>
        <span className="text-xs text-muted-foreground">Public: city + product only</span>
      </div>
      <p className="bg-muted px-3 py-2 text-sm text-muted-foreground">
        Enter only genuinely completed, paid sales. Never enter buyer names, emails, phone numbers or street addresses. The source reference stays private.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="sale-ref" className={label}>Source reference (private)</label>
          <input id="sale-ref" className={field} value={sourceReference} maxLength={120} onChange={(e) => setSourceReference(e.target.value)} placeholder="Invoice or order number" aria-invalid={!!errors.sourceReference} aria-describedby={errors.sourceReference ? "err-sourceReference" : undefined} data-testid="input-source-reference" />
          {err("sourceReference")}
        </div>
        <div>
          <label htmlFor="sale-country" className={label}>Country</label>
          <select id="sale-country" className={field} value={country} onChange={(e) => setCountry(e.target.value as "US" | "CA")} data-testid="select-country">
            <option value="US">United States</option><option value="CA">Canada</option>
          </select>
        </div>
        <div>
          <label htmlFor="sale-type" className={label}>Product type</label>
          <select id="sale-type" className={field} value={productType} onChange={(e) => setProductType(e.target.value as "container" | "genset")} data-testid="select-product-type">
            <option value="container">Container</option><option value="genset">Genset</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sale-product" className={label}>Product name (public)</label>
          <input id="sale-product" className={field} value={productName} maxLength={160} onChange={(e) => setProductName(e.target.value)} placeholder="20ft High Cube, one-trip" aria-invalid={!!errors.productName} data-testid="input-product-name" />
          {err("productName")}
        </div>
        <div>
          <label htmlFor="sale-city" className={label}>City (public)</label>
          <input id="sale-city" className={field} value={city} maxLength={100} onChange={(e) => setCity(e.target.value)} placeholder="Calgary, AB" aria-invalid={!!errors.city} data-testid="input-city" />
          {err("city")}
        </div>
        <div>
          <label htmlFor="sale-date" className={label}>Completed at (your local time)</label>
          <input id="sale-date" type="datetime-local" className={field} value={dateLocal} max={maxLocal} onChange={(e) => { setDateLocal(e.target.value); setDateTouched(true); }} aria-invalid={!!errors.purchasedAt} data-testid="input-purchased-at" />
          {err("purchasedAt")}
        </div>
      </div>

      <fieldset>
        <legend className={label}>Image (optional)</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button type="button" onClick={() => setImagePath("")} aria-pressed={!imagePath} className={`flex aspect-[4/3] items-center justify-center border text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${!imagePath ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground/40"}`} data-testid="button-image-none">No image</button>
          {IMAGE_CHOICES.map((img) => (
            <button key={img.path} type="button" onClick={() => setImagePath(img.path)} aria-pressed={imagePath === img.path} aria-label={img.label} className={`relative aspect-[4/3] overflow-hidden border-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary ${imagePath === img.path ? "border-primary" : "border-transparent hover:border-foreground/30"}`} data-testid={`button-image-${img.path}`}>
              <img src={img.path} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
        <label htmlFor="sale-image" className="mt-3 block text-xs text-muted-foreground">Or another existing path</label>
        <input id="sale-image" className={`${field} mt-1 font-mono`} value={imagePath} maxLength={300} onChange={(e) => setImagePath(e.target.value)} placeholder="/images/example.jpg" data-testid="input-image-path" />
        {err("imagePath")}
      </fieldset>

      <div className="space-y-3 border-t border-border pt-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" data-testid="checkbox-verified" />
          <span><strong>I confirm this sale was genuinely completed</strong> and the city and product details are accurate.</span>
        </label>
        {err("verified")}
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={displayApproved} onChange={(e) => setDisplayApproved(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" data-testid="checkbox-display-approved" />
          <span>Approve for public notifications. Leave unchecked to keep it hidden.</span>
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={pending} className="border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary" data-testid="button-cancel">Cancel</button>
        <button type="submit" disabled={pending} className="bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" data-testid="button-save-sale">
          {pending ? "Saving..." : initial ? "Save changes" : "Add sale"}
        </button>
      </div>
    </form>
  );
}
