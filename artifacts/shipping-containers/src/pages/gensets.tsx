import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Zap, Weight, Volume2, Fuel, Gauge, X } from "lucide-react";
import { useMarket } from "@/contexts/market";

interface Genset {
  id: string;
  brand: string;
  model: string;
  sku: string;
  power: string;
  kva: string;
  engine: string;
  engineBrand: string;
  cooling: string;
  weight: string;
  fuelTank: string;
  runtime: string;
  voltage: string;
  noise: string;
  compatible: string;
  emissions: string;
  controller: string;
  buyPrice: string;
  rentPrice: string;
  features: string[];
  badge?: string;
  desc: string;
}

const GENSETS: Genset[] = [
  // ── Carrier Transicold ─────────────────────────────────────────
  {
    id: "ct-ug15-050",
    brand: "Carrier Transicold",
    model: "GEN 6300",
    sku: "69UG15-050S-55",
    power: "15 kW",
    kva: "18.75 kVA",
    engine: "Perkins CT4-134Di",
    engineBrand: "Perkins",
    cooling: "Water-cooled",
    weight: "1,370 lbs",
    fuelTank: "50 US gal / 189 L",
    runtime: "72–80 hrs",
    voltage: "460V 3Ø (60 Hz) / 380V 3Ø (50 Hz)",
    noise: "71 dB(A)",
    compatible: "20 ft, 40 ft reefer",
    emissions: "EPA Tier 3 / EU Stage IIIA",
    controller: "Carrier APX",
    buyPrice: "$5,500",
    rentPrice: "$265/mo",
    badge: "Most Popular",
    features: [
      "Perkins CT4-134Di direct-injection diesel",
      "Carrier APX controller — digital auto-start",
      "50 US gal integral fuel tank",
      "Underslung ISO corner-casting mount",
      "460V / 380V dual voltage output",
      "Auto-start on shore power loss",
      "Low oil pressure & high temp shutdown",
      "Anti-theft immobilizer",
    ],
    desc: "The industry standard. Carrier's most popular underslung unit pairs the proven Perkins CT4-134Di engine with the APX controller — compatible with all major reefer brands and built for continuous unattended operation.",
  },
  {
    id: "ct-ug15-070",
    brand: "Carrier Transicold",
    model: "GEN 7500 XR",
    sku: "69UG15-070S-55",
    power: "15 kW",
    kva: "18.75 kVA",
    engine: "Perkins CT4-134Di",
    engineBrand: "Perkins",
    cooling: "Water-cooled",
    weight: "1,400 lbs",
    fuelTank: "68 US gal / 275 L",
    runtime: "100+ hrs",
    voltage: "460V 3Ø (60 Hz) / 380V 3Ø (50 Hz)",
    noise: "72 dB(A)",
    compatible: "20 ft, 40 ft reefer",
    emissions: "EPA Tier 3 / EU Stage IIIA",
    controller: "Carrier APX+",
    buyPrice: "$7,000",
    rentPrice: "$330/mo",
    features: [
      "Extended 68 US gal / 275 L fuel tank",
      "APX+ controller with CAN-bus monitoring",
      "600+ km estimated range without refueling",
      "Cycle-run mode — 30–40% fuel savings",
      "Underslung ISO corner-casting mount",
      "Remote diagnostics ready",
      "Anti-theft immobilizer",
      "CE & ISO 1496-2 certified",
    ],
    desc: "Extended-range variant with a 68-gallon tank delivering 100+ hours of autonomous runtime — the choice for long-haul cross-border routes where fuel stops are not an option.",
  },

  // ── Thermo King ────────────────────────────────────────────────
  {
    id: "tk-ug15",
    brand: "Thermo King",
    model: "UT-800",
    sku: "TK-UG15-55",
    power: "15 kW",
    kva: "18.75 kVA",
    engine: "Yanmar 3TNV88",
    engineBrand: "Yanmar",
    cooling: "Water-cooled",
    weight: "1,495 lbs",
    fuelTank: "55 US gal / 208 L",
    runtime: "80–90 hrs",
    voltage: "460V 3Ø (60 Hz) / 380V 3Ø (50 Hz)",
    noise: "72 dB(A)",
    compatible: "20 ft, 40 ft reefer",
    emissions: "EPA Tier 3 / EU Stage IIIA",
    controller: "Thermo King SmartPower",
    buyPrice: "$7,200",
    rentPrice: "$340/mo",
    badge: "Best Seller",
    features: [
      "Yanmar 3TNV88 water-cooled diesel",
      "SmartPower digital controller — LED display",
      "55 US gal integral fuel tank",
      "Completely welded steel frame (≥5g crash rated)",
      "Underslung ISO corner-casting mount",
      "Auto-start / auto-stop cycle-run mode",
      "Remote monitoring ready",
      "Low oil pressure & high water temp protection",
    ],
    desc: "Thermo King's flagship underslung. The Yanmar-powered UT-800 is one of the most widely deployed underslung gensets in North America — trusted for its robust welded frame and class-leading SmartPower controls.",
  },
  {
    id: "tk-ug15-ext",
    brand: "Thermo King",
    model: "UT-1000 XL",
    sku: "TK-UG15-68",
    power: "15 kW",
    kva: "18.75 kVA",
    engine: "Yanmar 4TNV88",
    engineBrand: "Yanmar",
    cooling: "Water-cooled",
    weight: "1,540 lbs",
    fuelTank: "68 US gal / 275 L",
    runtime: "100+ hrs",
    voltage: "460V 3Ø (60 Hz) / 380V 3Ø (50 Hz)",
    noise: "74 dB(A)",
    compatible: "20 ft, 40 ft, 40 ft HC reefer",
    emissions: "EPA Tier 3 / EU Stage IIIA",
    controller: "Thermo King SmartPower+",
    buyPrice: "$8,900",
    rentPrice: "$420/mo",
    features: [
      "Yanmar 4TNV88 4-cylinder diesel",
      "Extended 68 US gal / 275 L tank",
      "SmartPower+ with cloud telematics",
      "Dual-voltage output (460V / 380V)",
      "Cycle-run fuel saving mode",
      "Underslung ISO corner-casting mount",
      "Completely welded steel frame (≥5g crash rated)",
      "Cold-climate start kit included",
    ],
    desc: "Maximum endurance Thermo King. The 4-cylinder 68-gallon UT-1000 XL covers the longest routes with cloud-connected monitoring and dual-voltage output for global reefer compatibility.",
  },

  // ── Phasebox ───────────────────────────────────────────────────
  {
    id: "pb-15t4",
    brand: "Phasebox",
    model: "PB-15 Tier4",
    sku: "PB-UG15-T4F",
    power: "15 kW",
    kva: "18.75 kVA",
    engine: "Mitsubishi S4L2",
    engineBrand: "Mitsubishi",
    cooling: "Water-cooled",
    weight: "1,380 lbs",
    fuelTank: "58 US gal / 219 L",
    runtime: "90+ hrs",
    voltage: "460V 3Ø (60 Hz) / 380V 3Ø (50 Hz)",
    noise: "69 dB(A)",
    compatible: "20 ft, 40 ft reefer",
    emissions: "EPA Tier 4 Final",
    controller: "Deepsea DSE7320",
    buyPrice: "$9,200",
    rentPrice: "$445/mo",
    badge: "Tier 4",
    features: [
      "Mitsubishi S4L2 — EPA Tier 4 Final certified",
      "Lowest emissions in class — port zone compliant",
      "Deepsea DSE7320 controller with GSM telematics",
      "58 US gal integral fuel tank",
      "69 dB(A) — quietest diesel in the lineup",
      "Underslung ISO corner-casting mount",
      "Remote diagnostics + fleet management portal",
      "CE / ISO 9001 / ISO 1496-2 certified",
    ],
    desc: "The cleanest diesel underslung available. Phasebox's Mitsubishi-powered PB-15 meets EPA Tier 4 Final emissions — the requirement for port zone and CARB-restricted operations — at class-leading noise levels.",
  },
  {
    id: "pb-15t4-dual",
    brand: "Phasebox",
    model: "PB-15 Dual Power",
    sku: "PB-UG15-2X",
    power: "2 × 15 kW",
    kva: "2 × 18.75 kVA",
    engine: "Mitsubishi S4L2",
    engineBrand: "Mitsubishi",
    cooling: "Water-cooled",
    weight: "1,520 lbs",
    fuelTank: "58 US gal / 219 L",
    runtime: "45–55 hrs per container",
    voltage: "460V 3Ø (60 Hz) / 380V 3Ø (50 Hz)",
    noise: "70 dB(A)",
    compatible: "Dual 20 ft reefer containers",
    emissions: "EPA Tier 4 Final",
    controller: "Deepsea DSE7320",
    buyPrice: "$12,400",
    rentPrice: "$580/mo",
    badge: "Dual",
    features: [
      "Powers two 20ft reefer containers simultaneously",
      "Split output — independent temp control per container",
      "Mitsubishi S4L2 — EPA Tier 4 Final",
      "Deepsea DSE7320 dual-channel controller",
      "58 US gal shared fuel tank",
      "Ideal for multi-container flatbed configurations",
      "CE / ISO 1496-2 certified",
    ],
    desc: "The only underslung genset in our lineup capable of simultaneously powering two 20ft reefer containers from a single unit — ideal for double-stack flatbeds and multi-container cold-chain operations.",
  },

  // ── Karlier Power ──────────────────────────────────────────────
  {
    id: "kp-15y",
    brand: "Karlier Power",
    model: "KP-15Y",
    sku: "KP-UG15-YNM",
    power: "15 kW",
    kva: "18.75 kVA",
    engine: "Yanmar 3TNV82A",
    engineBrand: "Yanmar",
    cooling: "Water-cooled",
    weight: "1,360 lbs",
    fuelTank: "50 US gal / 189 L",
    runtime: "72–80 hrs",
    voltage: "460V 3Ø (60 Hz) / 380V 3Ø (50 Hz)",
    noise: "73 dB(A)",
    compatible: "20 ft, 40 ft reefer",
    emissions: "EPA Tier 3 / EU Stage IIIA",
    controller: "Smartgen HGM6120",
    buyPrice: "$4,200",
    rentPrice: "$210/mo",
    badge: "Best Value",
    features: [
      "Yanmar 3TNV82A water-cooled diesel",
      "Smartgen HGM6120 digital controller",
      "50 US gal integral fuel tank",
      "Underslung ISO corner-casting mount",
      "460V / 380V dual voltage",
      "ISO 9001 + CE certified",
      "Stamford brushless alternator",
      "Oil bath air filter — easy maintenance",
    ],
    desc: "ISO 9001 and CE certified with a Yanmar engine and Stamford alternator — Karlier's KP-15Y delivers the same proven 15 kW underslung platform at a significantly lower price point. Ideal for fleet buyers.",
  },
  {
    id: "kp-15c",
    brand: "Karlier Power",
    model: "KP-15C",
    sku: "KP-UG15-CUM",
    power: "15 kW",
    kva: "18.75 kVA",
    engine: "Cummins QSB3.3",
    engineBrand: "Cummins",
    cooling: "Water-cooled",
    weight: "1,390 lbs",
    fuelTank: "58 US gal / 219 L",
    runtime: "85–95 hrs",
    voltage: "460V 3Ø (60 Hz) / 380V 3Ø (50 Hz)",
    noise: "72 dB(A)",
    compatible: "20 ft, 40 ft reefer",
    emissions: "EPA Tier 3 / EU Stage IIIA",
    controller: "ComAp InteliLite NT",
    buyPrice: "$5,600",
    rentPrice: "$270/mo",
    features: [
      "Cummins QSB3.3 diesel engine",
      "ComAp InteliLite NT controller",
      "Extended 58 US gal / 219 L fuel tank",
      "Leroy Somer brushless alternator",
      "Spin-on self-evacuating fuel filter",
      "Underslung ISO corner-casting mount",
      "Cloud monitoring system available",
      "ISO 9001 + CE certified",
    ],
    desc: "Cummins-powered reliability at a competitive price. The KP-15C uses the globally serviced QSB3.3 engine with a ComAp controller and extended 58-gallon tank — making it one of the most cost-effective long-range underslung options available.",
  },
];

const BRANDS = ["All", "Carrier Transicold", "Thermo King", "Phasebox", "Karlier Power"];

const BRAND_COLORS: Record<string, string> = {
  "Carrier Transicold": "bg-sky-900/60 text-sky-300",
  "Thermo King":        "bg-blue-900/60 text-blue-300",
  "Phasebox":           "bg-violet-900/60 text-violet-300",
  "Karlier Power":      "bg-amber-900/60 text-amber-300",
};

const BRAND_BG: Record<string, string> = {
  "Carrier Transicold": "bg-sky-900/60",
  "Thermo King":        "bg-blue-900/60",
  "Phasebox":           "bg-violet-900/60",
  "Karlier Power":      "bg-amber-900/60",
};

const BRAND_IMAGES: Record<string, string> = {
  "Carrier Transicold": "/images/genset-carrier.png",
  "Thermo King":        "/images/genset-thermo-king.png",
  "Phasebox":           "/images/genset-product-shot.jpg",
  "Karlier Power":      "/images/genset-karlier.png",
};

const BADGE_COLORS: Record<string, string> = {
  "Best Seller": "bg-primary text-primary-foreground",
  "Most Popular":"bg-primary text-primary-foreground",
  "Best Value":  "bg-amber-500 text-black",
  "Tier 4":      "bg-emerald-600 text-white",
  "Dual":        "bg-violet-600 text-white",
};

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background border border-border p-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function Gensets() {
  const { formatPriceLabel } = useMarket();
  const [activeBrand, setActiveBrand] = useState("All");
  const [selected, setSelected] = useState<Genset | null>(null);

  const filtered = activeBrand === "All" ? GENSETS : GENSETS.filter(g => g.brand === activeBrand);

  return (
    <div className="bg-background min-h-screen pt-16">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img
            src="/images/genset-installed.jpg"
            alt="Underslung genset installed under container trailer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-background/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 md:px-8 max-w-7xl py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="text-primary text-xs font-bold tracking-[0.25em] uppercase mb-4">Underslung / Undermount</p>
            <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight leading-none mb-5">
              Reefer<br />Gensets
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mb-8">
              15 kW / 18.75 kVA diesel generator sets that bolt directly under the chassis — keeping the full container interior clear while powering any reefer unit continuously.
            </p>
            <div className="flex flex-wrap gap-2">
              {BRANDS.slice(1).map(b => (
                <span key={b} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-border ${BRAND_COLORS[b]}`}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Key specs bar ─────────────────────────────────────────── */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {[
              { label: "Standard Output",  value: "15 kW / 18.75 kVA" },
              { label: "Runtime (std tank)", value: "72–100+ hrs" },
              { label: "Weight Range",     value: "1,360–1,540 lbs" },
              { label: "Tank Capacity",    value: "50–68 US gal" },
            ].map(s => (
              <div key={s.label} className="px-6 py-5">
                <div className="text-xl md:text-2xl font-display font-bold text-primary leading-tight">{s.value}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand filter ──────────────────────────────────────────── */}
      <section className="border-b border-border bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="flex gap-1 flex-wrap py-3">
            {BRANDS.map(b => (
              <button
                key={b}
                onClick={() => setActiveBrand(b)}
                className={`px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                  activeBrand === b
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Genset grid ───────────────────────────────────────────── */}
      <section className="py-12">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {filtered.map(g => (
              <div
                key={g.id}
                onClick={() => setSelected(g)}
                className="group bg-card hover:bg-muted/20 transition-all duration-200 cursor-pointer flex flex-col relative"
              >
                {/* Product photo */}
                <div className="bg-white relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                  <img
                    src={BRAND_IMAGES[g.brand]}
                    alt={`${g.brand} ${g.model}`}
                    className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className={`absolute top-0 left-0 right-0 h-1 ${BRAND_BG[g.brand] ?? "bg-muted"}`} />
                  {g.badge && (
                    <span className={`absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 ${BADGE_COLORS[g.badge] ?? "bg-muted"}`}>
                      {g.badge}
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1 border-t border-border">
                  <div className="mb-3">
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${BRAND_COLORS[g.brand]?.split(" ")[1] ?? "text-muted-foreground"}`}>
                      {g.brand}
                    </span>
                    <div className="flex items-start justify-between gap-2 mt-0.5">
                      <h3 className="text-xl font-display font-bold uppercase tracking-tight">{g.model}</h3>
                      <span className="text-[9px] font-mono text-muted-foreground flex-shrink-0 mt-1">{g.sku}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span className="text-primary font-bold text-sm">{g.power}</span>
                      <span className="text-border">·</span>
                      <span className="text-muted-foreground text-xs">{g.kva}</span>
                      <span className="text-border">·</span>
                      <span className="text-muted-foreground text-xs">{g.engineBrand}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{g.desc}</p>

                  <div className="grid grid-cols-2 gap-px bg-border mb-4">
                    <SpecCell label="Weight"    value={g.weight} />
                    <SpecCell label="Fuel Tank" value={g.fuelTank} />
                    <SpecCell label="Runtime"   value={g.runtime} />
                    <SpecCell label="Emissions" value={g.emissions.split(" / ")[0]} />
                  </div>

                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-display font-bold">{formatPriceLabel(g.buyPrice)}</div>
                      <div className="text-xs text-muted-foreground">{formatPriceLabel(g.rentPrice)}</div>
                    </div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                      Full Specs <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 h-0.5 bg-primary w-0 group-hover:w-full transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="border-t border-border bg-card py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary text-xs font-bold tracking-[0.25em] uppercase mb-3">How It Works</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight mb-5">
                Under the Chassis.<br />Always Running.
              </h2>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                The underslung genset bolts to the ISO corner castings beneath the trailer chassis. From there it powers the reefer unit continuously — no shore power needed, no cable runs, no external equipment. The unit stays on the trailer; only the container swaps.
              </p>
              <div className="grid grid-cols-2 gap-px bg-border">
                {[
                  { label: "Standard Output",  value: "15 kW / 18.75 kVA" },
                  { label: "Reefer Draw",       value: "6.5–7.5 kW typical" },
                  { label: "Voltage",           value: "460V / 380V 3-phase" },
                  { label: "Certifications",    value: "ISO 1496-2, CE, ISO 9001" },
                  { label: "Mounting",          value: "ISO corner castings" },
                  { label: "Compatible",        value: "20 ft & 40 ft reefer" },
                ].map(({ label, value }) => (
                  <SpecCell key={label} label={label} value={value} />
                ))}
              </div>
            </div>
            <div className="overflow-hidden border border-border">
              <img
                src="/images/genset-installed.jpg"
                alt="Underslung genset installed under container on trailer"
                className="w-full object-cover"
                style={{ aspectRatio: "16/9" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Underslung vs Clip-on comparison ─────────────────────── */}
      <section className="border-t border-border bg-background py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <h2 className="text-3xl font-display font-bold uppercase tracking-tight mb-2">Underslung vs. Clip-On</h2>
          <p className="text-muted-foreground text-sm mb-8">Not all genset mounting styles are the same. Here's the key difference.</p>
          <div className="overflow-x-auto border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {["Feature", "Underslung (This Page)", "Clip-On"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Mounted to",         "Trailer chassis frame",        "Front end of container"],
                  ["Stays with trailer?", "✅ Yes — container swaps",    "❌ No — moves with container"],
                  ["Interior impact",    "None — full interior clear",   "None — exterior mount"],
                  ["Road transport",     "✅ Permanent — always ready",  "⚠️ Must attach before each trip"],
                  ["Rail compatible",    "✅ Yes",                       "✅ Yes"],
                  ["Typical weight",     "1,360–1,540 lbs",              "1,100–1,300 lbs"],
                ].map(([f, u, c]) => (
                  <tr key={f} className="hover:bg-muted/30">
                    <td className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">{f}</td>
                    <td className="px-5 py-3 text-emerald-400 font-medium">{u}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Quick reference table ─────────────────────────────────── */}
      <section className="border-t border-border bg-card py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <h2 className="text-3xl font-display font-bold uppercase tracking-tight mb-2">All Models at a Glance</h2>
          <p className="text-muted-foreground text-sm mb-8">Click any row for full specifications.</p>
          <div className="overflow-x-auto border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Brand</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Model</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hidden sm:table-cell">Engine</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hidden md:table-cell">Tank</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hidden lg:table-cell">Runtime</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hidden lg:table-cell">Emissions</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Buy</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest hidden sm:table-cell">Rent/mo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {GENSETS.map(g => (
                  <tr key={g.id} onClick={() => setSelected(g)} className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${BRAND_COLORS[g.brand]}`}>
                        {g.brand}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{g.model}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{g.engineBrand}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{g.fuelTank.split(" / ")[0]}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{g.runtime}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs">
                      <span className={g.emissions.includes("Tier 4") ? "text-emerald-400 font-semibold" : "text-muted-foreground"}>
                        {g.emissions.split(" / ")[0]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-display font-bold text-primary">{formatPriceLabel(g.buyPrice)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{formatPriceLabel(g.rentPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-background py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight mb-3">
                Bundle with a Reefer Container
              </h2>
              <p className="text-muted-foreground max-w-lg text-sm">
                Order a genset with any reefer purchase or rental. We'll mount it to the trailer chassis, test the output and auto-start function, then deliver it ready to run.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link href="/quote" className="inline-flex h-12 items-center justify-center bg-primary px-8 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all uppercase tracking-wider">
                Build a Quote
              </Link>
              <Link href="/contact" className="inline-flex h-12 items-center justify-center border border-border bg-background px-8 text-sm font-bold hover:bg-muted transition-all uppercase tracking-wider">
                Talk to a Specialist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Detail modal ──────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card border border-border max-w-2xl w-full max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            <div className="bg-white relative" style={{ aspectRatio: "16/9" }}>
              <img
                src={BRAND_IMAGES[selected.brand]}
                alt={`${selected.brand} ${selected.model}`}
                className="w-full h-full object-contain p-8"
              />
              <div className={`absolute top-0 left-0 right-0 h-1 ${BRAND_BG[selected.brand] ?? "bg-muted"}`} />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 bg-background/90 border border-border p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-3 flex-wrap">
              <div>
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${BRAND_COLORS[selected.brand]?.split(" ")[1] ?? ""}`}>
                  {selected.brand}
                </span>
                <h2 className="text-2xl font-display font-bold uppercase">{selected.model}</h2>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">SKU: {selected.sku}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-primary font-bold text-sm">{selected.power}</span>
                  <span className="text-border">·</span>
                  <span className="text-muted-foreground text-sm">{selected.kva}</span>
                </div>
              </div>
              {selected.badge && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 ${BADGE_COLORS[selected.badge] ?? "bg-muted"}`}>
                  {selected.badge}
                </span>
              )}
            </div>

            <div className="p-6">
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{selected.desc}</p>

              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Specifications</p>
              <div className="grid grid-cols-2 gap-px bg-border mb-6">
                {[
                  { l: "Power Output",   v: `${selected.power} / ${selected.kva}` },
                  { l: "Engine",         v: selected.engine },
                  { l: "Cooling",        v: selected.cooling },
                  { l: "Emissions",      v: selected.emissions },
                  { l: "Weight",         v: selected.weight },
                  { l: "Fuel Tank",      v: selected.fuelTank },
                  { l: "Runtime",        v: selected.runtime },
                  { l: "Voltage",        v: selected.voltage },
                  { l: "Noise",          v: selected.noise },
                  { l: "Controller",     v: selected.controller },
                  { l: "Compatible",     v: selected.compatible },
                  { l: "Mounting",       v: "Underslung / ISO corner castings" },
                ].map(({ l, v }) => (
                  <SpecCell key={l} label={l} value={v} />
                ))}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Included Features</p>
              <ul className="grid grid-cols-1 gap-1.5 mb-6">
                {selected.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="border border-border p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-3xl font-display font-bold">{formatPriceLabel(selected.buyPrice)}</div>
                  <div className="text-xs text-muted-foreground">Or rent from {formatPriceLabel(selected.rentPrice)}</div>
                </div>
                <Link
                  href="/quote"
                  onClick={() => setSelected(null)}
                  className="inline-flex h-11 items-center gap-2 bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all uppercase tracking-wider"
                >
                  Add to Quote <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
