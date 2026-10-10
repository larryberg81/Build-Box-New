import { useState } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, Package, Truck, Zap, Wrench, ArrowRight } from "lucide-react";
import { apiUrl } from "@/lib/api";

function OrderSummary({ p }: { p: URLSearchParams }) {
  const mode      = p.get("mode") ?? "purchase";
  const container = p.get("container") ?? "";
  const color      = p.get("color") ?? "";
  const configuration = p.get("configuration") ?? "";
  const total     = p.get("total") ?? "";
  const base      = p.get("base") ?? "";
  const delivery  = p.get("delivery") ?? "";
  const genset    = p.get("genset") ?? "";
  const mods      = p.get("mods") ?? "";
  const state     = p.get("state") ?? "";
  const zip       = p.get("zip") ?? "";
  const monthly   = p.get("monthly") ?? "";
  const duration  = p.get("duration") ?? "";
  const city      = p.get("city") ?? "";
  const country   = p.get("country") ?? "United States";
  const currency  = p.get("currency") === "CAD" ? "CAD" : "USD";
  const rate      = Number(p.get("rate")) || 1;
  const formatMoney = (value: string) => {
    const amount = Math.round(Number(value) * (currency === "CAD" ? rate : 1));
    return currency === "CAD" ? `CA$${amount.toLocaleString("en-CA")}` : `$${amount.toLocaleString("en-US")}`;
  };

  const modList = mods ? mods.split(" | ").filter(Boolean) : [];

  return (
    <div className="border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="bg-primary px-5 py-3 flex items-center gap-2">
        <Package className="h-4 w-4 text-primary-foreground" />
        <p className="text-primary-foreground font-bold uppercase tracking-widest text-xs">Your Selection</p>
        <span className="ml-auto text-primary-foreground/70 text-[10px] uppercase tracking-wider">Locked In</span>
      </div>
      <div className="p-5 space-y-3">
        {/* Container */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Container</p>
            <p className="font-display font-bold text-lg uppercase leading-tight">{container}</p>
            {color && (
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-primary">Color: {color}</p>
            )}
            {configuration && (
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-primary">Configuration: {configuration}</p>
            )}
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/20 text-primary">
              {mode === "purchase" ? "Purchase" : `Rental — ${duration}`}
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-display font-bold text-primary">{formatMoney(total)}</p>
            {mode === "rental" && monthly && (
              <p className="text-xs text-muted-foreground">{formatMoney(monthly)}/mo</p>
            )}
            <p className="text-[10px] font-bold text-muted-foreground">{currency}</p>
          </div>
        </div>

        {/* Line items */}
        <div className="divide-y divide-border border border-border text-xs">
          <div className="flex justify-between px-3 py-2 bg-background/50">
            <span className="text-muted-foreground">{mode === "purchase" ? "Container" : "Monthly base"}</span>
            <span className="font-bold">{formatMoney(base)}</span>
          </div>
          {modList.length > 0 && (
            <div className="flex justify-between px-3 py-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Wrench className="h-3 w-3" /> Modifications
              </span>
              <span className="font-semibold text-right max-w-[55%]">{modList.join(", ")}</span>
            </div>
          )}
          {genset && (
            <div className="flex justify-between px-3 py-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-primary" /> Genset
              </span>
              <span className="font-semibold text-right max-w-[55%]">{genset}</span>
            </div>
          )}
          <div className="flex justify-between px-3 py-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Truck className="h-3 w-3" /> Delivery fee
            </span>
            <span className="font-bold">{formatMoney(delivery)}</span>
          </div>
          {(state || zip) && (
            <div className="flex justify-between px-3 py-2 bg-background/50">
              <span className="text-muted-foreground">Deliver to</span>
              <span className="font-semibold">{[city, state, zip, country].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  const { toast } = useToast();
  const search    = useSearch();
  const params    = new URLSearchParams(search);
  const hasQuote  = params.has("container");

  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [interest, setInterest] = useState("");

  // ── Quote-flow submission ──────────────────────────────────────
  const handleQuoteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd   = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);
    const mods     = params.get("mods") ?? "";
    const genset   = params.get("genset") ?? "";
    const modList  = mods ? mods.split(" | ").filter(Boolean) : [];
    const currency = params.get("currency") === "CAD" ? "CAD" : "USD";
    const rate = Number(params.get("rate")) || 1;
    const emailMoney = (value: string | null) => {
      const amount = Math.round(Number(value) * (currency === "CAD" ? rate : 1));
      return `${currency === "CAD" ? "CA$" : "$"}${amount.toLocaleString(currency === "CAD" ? "en-CA" : "en-US")} ${currency}`;
    };
    try {
      const res = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject:        `Built Box Containers — Formal Quote Request: ${params.get("container")}`,
          name:           data.name,
          email:          data.email,
          phone:          data.phone || "Not provided",
          address:        data.address || "Not provided",
          container:      params.get("container"),
          color:          params.get("color") || "Not specified",
          configuration:  params.get("configuration") || "Not specified",
          mode:           params.get("mode"),
          mods:           modList.length ? modList.join(", ") : "None",
          genset:         genset || "None",
           total:          emailMoney(params.get("total")),
           base_price:     emailMoney(params.get("base")),
           delivery_fee:   emailMoney(params.get("delivery")),
          ...(params.get("monthly") ? {
             monthly:  `${emailMoney(params.get("monthly"))}/mo`,
            duration: params.get("duration") ?? "",
          } : {}),
          delivery_state: params.get("state") || "Not specified",
           delivery_city: params.get("city") || "Not specified",
          delivery_zip:   params.get("zip")   || "Not specified",
           country: params.get("country") || "United States",
           currency,
          notes:          data.notes || "None",
        }),
      });
      const result = await res.json();
      if (result.success) {
        setDone(true);
      } else {
        toast({ title: "Send failed", description: result.error ?? "Please try again or email us directly.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Please email info@builtboxcontainer.com", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── General contact submission ─────────────────────────────────
  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject:  `Built Box Containers — Contact Form: ${interest || "General Inquiry"}`,
          name:     `${data.firstName} ${data.lastName}`,
          email:    data.email,
          phone:    data.phone || "Not provided",
          interest: interest || "Not specified",
          message:  data.message || "No details provided",
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "Message Sent", description: "A Built Box Containers representative will contact you shortly." });
        form.reset();
        setInterest("");
      } else {
        toast({ title: "Send failed", description: result.error ?? "Please try again or email us directly.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Please email info@builtboxcontainer.com", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Quote flow ─────────────────────────────────────────────────
  if (hasQuote) {
    return (
      <div className="bg-background min-h-screen pt-16">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl py-12 md:py-20">

          {done ? (
            <div className="max-w-lg mx-auto text-center py-24">
              <div className="w-16 h-16 bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-display font-bold uppercase tracking-tight mb-3">Quote Request Sent</h1>
              <p className="text-muted-foreground mb-2">
                We've received your request for a <strong className="text-foreground">{params.get("container")}</strong>
                {params.get("color") ? <> in <strong className="text-foreground">{params.get("color")}</strong></> : ""}
                {params.get("configuration") ? <> with <strong className="text-foreground">{params.get("configuration")}</strong></> : ""}.
              </p>
              <p className="text-muted-foreground text-sm mb-8">
                A Built Box Containers specialist will reach out within 24 hours with your formal quote.
              </p>
              <a href="/" className="inline-flex h-12 items-center gap-2 bg-primary px-8 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all uppercase tracking-wider">
                Back to Home <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

              {/* Left: locked order summary */}
              <div className="space-y-6">
                <div>
                  <p className="text-primary text-xs font-bold tracking-[0.25em] uppercase mb-2">Almost Done</p>
                  <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight leading-none">
                    Confirm Your Quote
                  </h1>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    Your selection is saved below. Just fill in your contact details and we'll send a formal quote to your inbox within 24 hours.
                  </p>
                </div>

                <OrderSummary p={params} />

                <div className="space-y-2 text-xs text-muted-foreground">
                  {["No commitment required", "Response within 24 hours", "Nationwide delivery available"].map(t => (
                    <div key={t} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" /> {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: personal details form */}
              <div className="bg-card border border-border p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Your Details</p>
                <form onSubmit={handleQuoteSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" required placeholder="Jane Smith" className="bg-background" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" required placeholder="jane@company.com" className="bg-background" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" className="bg-background" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder={params.get("country") === "Canada" ? "123 Main St, City, Province, Postal Code" : "123 Main St, City, State ZIP"}
                      className="bg-background"
                    />
                    <p className="text-[10px] text-muted-foreground">Full address helps us give you the most accurate delivery quote.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Additional Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Textarea id="notes" name="notes" rows={3} placeholder="Site access notes, preferred delivery window, questions..." className="bg-background" />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-sm font-bold uppercase tracking-wider mt-2"
                  >
                    {loading ? "Sending…" : "Send My Quote Request"}
                  </Button>
                </form>
              </div>

            </div>
          )}
        </div>
      </div>
    );
  }

  // ── General contact (no quote params) ─────────────────────────
  return (
    <div className="py-12 md:py-24 bg-background min-h-[80vh] pt-28">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight mb-6">Get in Touch</h1>
            <p className="text-lg text-muted-foreground mb-10">
              Need a standard container or a custom modification? Tell us what you're building and we'll get back to you with pricing and availability.
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-bold uppercase tracking-widest text-sm mb-2 text-primary">Headquarters</h3>
                <p className="text-muted-foreground">100 Industrial Parkway<br />Detroit, MI 48209</p>
              </div>
              <div>
                <h3 className="font-display font-bold uppercase tracking-widest text-sm mb-2 text-primary">Contact</h3>
                <p className="text-muted-foreground">1-800-BUILT-BOX<br />info@builtboxcontainer.com</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-8 border border-border shadow-lg">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" required className="bg-background" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="bg-background" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" className="bg-background" />
              </div>

              <div className="space-y-2">
                <Label>Interest</Label>
                <Select value={interest} onValueChange={setInterest}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select container type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20ft Standard Storage">20' Standard Storage</SelectItem>
                    <SelectItem value="40ft Standard Storage">40' Standard Storage</SelectItem>
                    <SelectItem value="Reefer Container">Reefer Container</SelectItem>
                    <SelectItem value="Underslung Genset">Underslung Genset</SelectItem>
                    <SelectItem value="Pop-up Retail">Pop-up Retail</SelectItem>
                    <SelectItem value="Jobsite Office">Jobsite Office</SelectItem>
                    <SelectItem value="Custom Modification">Custom Modification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Project Details</Label>
                <Textarea id="message" name="message" rows={4} className="bg-background" placeholder="Tell us about your project timeline and location..." />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold uppercase tracking-wider">
                {loading ? "Sending..." : "Submit Request"}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
