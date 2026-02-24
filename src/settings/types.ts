import type { ScorerThresholds } from "../scorer/types";

export interface Settings {
  enabled: boolean;
  thresholds: ScorerThresholds;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  thresholds: {
    low: 0.25,
    medium: 0.6,
    high: 0.85,
  },
};

export interface Stats {
  low: number;
  medium: number;
  high: number;
}

export const DEFAULT_STATS: Stats = { low: 0, medium: 0, high: 0 };
