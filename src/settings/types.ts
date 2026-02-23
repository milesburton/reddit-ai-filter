import type { ScorerThresholds } from "../scorer/types";

export interface Settings {
  enabled: boolean;
  thresholds: ScorerThresholds;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  thresholds: {
    low: 0.4,
    medium: 0.6,
    high: 0.85,
  },
};
