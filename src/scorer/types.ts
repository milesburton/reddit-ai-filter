export type SuspicionTier = "clean" | "low" | "medium" | "high";

export interface SuspicionScore {
  score: number; // 0–1
  tier: SuspicionTier;
}

export interface ScorerThresholds {
  low: number; // default 0.25
  medium: number; // default 0.6
  high: number; // default 0.85
}

export const DEFAULT_THRESHOLDS: ScorerThresholds = {
  low: 0.25,
  medium: 0.6,
  high: 0.85,
};
