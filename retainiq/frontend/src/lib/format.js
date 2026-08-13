const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(value) {
  return inrFormatter.format(Math.round(value || 0));
}

export function formatPct(fraction) {
  return `${Math.round((fraction || 0) * 100)}%`;
}

export function riskBandFromProb(prob) {
  if (prob >= 0.7) return "high";
  if (prob >= 0.4) return "medium";
  return "low";
}

export const RISK_BAND_STYLES = {
  high: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};
