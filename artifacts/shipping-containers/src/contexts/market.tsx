import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiUrl } from "@/lib/api";

export type Market = "US" | "CA";

export const CANADIAN_LOCATIONS: Record<string, string[]> = {
  AB: ["Calgary", "Edmonton", "Fort McMurray", "Grande Prairie", "Lethbridge", "Red Deer"],
  BC: ["Burnaby", "Kelowna", "Nanaimo", "Prince George", "Richmond", "Surrey", "Vancouver", "Victoria"],
  MB: ["Brandon", "Steinbach", "Thompson", "Winnipeg"],
  NB: ["Bathurst", "Fredericton", "Moncton", "Saint John"],
  NL: ["Corner Brook", "Gander", "Mount Pearl", "St. John's"],
  NS: ["Dartmouth", "Halifax", "Sydney", "Truro"],
  NT: ["Hay River", "Inuvik", "Yellowknife"],
  NU: ["Cambridge Bay", "Iqaluit", "Rankin Inlet"],
  ON: ["Barrie", "Brampton", "Hamilton", "Kingston", "Kitchener", "London", "Mississauga", "Ottawa", "Sudbury", "Thunder Bay", "Toronto", "Windsor"],
  PE: ["Charlottetown", "Summerside"],
  QC: ["Gatineau", "Laval", "Lévis", "Longueuil", "Montreal", "Quebec City", "Saguenay", "Sherbrooke", "Trois-Rivières"],
  SK: ["Moose Jaw", "Prince Albert", "Regina", "Saskatoon"],
  YT: ["Dawson City", "Watson Lake", "Whitehorse"],
};

export const CANADIAN_PROVINCES: [string, string][] = [
  ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"], ["NB", "New Brunswick"],
  ["NL", "Newfoundland and Labrador"], ["NS", "Nova Scotia"], ["NT", "Northwest Territories"],
  ["NU", "Nunavut"], ["ON", "Ontario"], ["PE", "Prince Edward Island"], ["QC", "Quebec"],
  ["SK", "Saskatchewan"], ["YT", "Yukon"],
];

type MarketContextValue = {
  market: Market;
  setMarket: (market: Market) => void;
  currency: "USD" | "CAD";
  cadRate: number;
  convertUsd: (amount: number) => number;
  formatMoney: (usdAmount: number) => string;
  formatPriceLabel: (usdLabel: string | undefined) => string;
};

const MarketContext = createContext<MarketContextValue | null>(null);
const FALLBACK_CAD_RATE = 1.38;

function detectMarket(): Market {
  const saved = localStorage.getItem("builtbox-market");
  if (saved === "US" || saved === "CA") return saved;
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return locales.some(locale => /-CA$/i.test(locale)) || /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Whitehorse|Yellowknife|Iqaluit)$/.test(timezone)
    ? "CA"
    : "US";
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [market, setMarketState] = useState<Market>(() => detectMarket());
  const [cadRate, setCadRate] = useState(FALLBACK_CAD_RATE);

  useEffect(() => {
    const cached = localStorage.getItem("builtbox-cad-rate");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { rate: number; savedAt: number };
        if (Number.isFinite(parsed.rate)) setCadRate(parsed.rate);
        if (Date.now() - parsed.savedAt < 12 * 60 * 60 * 1000) return;
      } catch {
        localStorage.removeItem("builtbox-cad-rate");
      }
    }
    fetch(apiUrl("/api/exchange-rate"))
      .then(response => response.ok ? response.json() : Promise.reject())
      .then((data: { rate?: number }) => {
        if (!data.rate) return;
        setCadRate(data.rate);
        localStorage.setItem("builtbox-cad-rate", JSON.stringify({ rate: data.rate, savedAt: Date.now() }));
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<MarketContextValue>(() => {
    const convertUsd = (amount: number) => market === "CA" ? Math.round(amount * cadRate) : amount;
    const formatMoney = (amount: number) => {
      const converted = convertUsd(amount);
      return market === "CA"
        ? `CA$${converted.toLocaleString("en-CA")}`
        : `$${converted.toLocaleString("en-US")}`;
    };
    const formatPriceLabel = (label: string | undefined) => {
      if (!label) return "";
      const match = label.match(/\$([\d,]+(?:\.\d+)?)/);
      if (!match) return label;
      const amount = Number(match[1].replace(/,/g, ""));
      return label.replace(match[0], formatMoney(amount));
    };
    return { market, setMarket: setMarketState, currency: market === "CA" ? "CAD" : "USD", cadRate, convertUsd, formatMoney, formatPriceLabel };
  }, [market, cadRate]);

  const setMarket = (next: Market) => {
    localStorage.setItem("builtbox-market", next);
    setMarketState(next);
  };

  return <MarketContext.Provider value={{ ...value, setMarket }}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const value = useContext(MarketContext);
  if (!value) throw new Error("useMarket must be used within MarketProvider");
  return value;
}