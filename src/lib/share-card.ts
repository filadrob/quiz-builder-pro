// Readiness tier config — tune thresholds/labels/colors here.
export interface TierConfig {
  minPct: number; // inclusive lower bound (0-100)
  label: string;
  color: string; // hex used inside the exported PNG (no CSS vars)
  glow: string;
}

// Ordered high → low. First matching minPct wins.
export const TIERS: TierConfig[] = [
  { minPct: 90, label: "RADIANT",     color: "#ffb454", glow: "rgba(255,180,84,0.65)" },
  { minPct: 75, label: "AETHERIAL",   color: "#ff5a8a", glow: "rgba(255,90,138,0.6)" },
  { minPct: 60, label: "RESPLENDENT", color: "#46e0b0", glow: "rgba(70,224,176,0.6)" },
  { minPct: 40, label: "SERVICEABLE", color: "#8fd694", glow: "rgba(143,214,148,0.5)" },
  { minPct: 0,  label: "WEATHERED",   color: "#8a9a94", glow: "rgba(138,154,148,0.45)" },
];

export function tierForPct(pct: number): TierConfig {
  return TIERS.find((t) => pct >= t.minPct) ?? TIERS[TIERS.length - 1];
}

export const POINTS_PER_QUESTION = 1000;
