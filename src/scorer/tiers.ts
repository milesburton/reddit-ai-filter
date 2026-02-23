import type { ScorerThresholds, SuspicionScore, SuspicionTier } from "./types";
import { DEFAULT_THRESHOLDS } from "./types";

export function scoreToTier(
  score: number,
  thresholds: ScorerThresholds = DEFAULT_THRESHOLDS
): SuspicionTier {
  if (score >= thresholds.high) return "high";
  if (score >= thresholds.medium) return "medium";
  if (score >= thresholds.low) return "low";
  return "clean";
}

export function toSuspicionScore(
  score: number,
  thresholds?: ScorerThresholds
): SuspicionScore {
  return { score, tier: scoreToTier(score, thresholds) };
}
