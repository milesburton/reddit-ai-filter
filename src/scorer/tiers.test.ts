import { describe, expect, it } from "vitest";
import { scoreToTier, toSuspicionScore } from "./tiers";

describe("scoreToTier", () => {
  it("returns clean for scores below low threshold", () => {
    expect(scoreToTier(0)).toBe("clean");
    expect(scoreToTier(0.39)).toBe("clean");
  });

  it("returns low for scores between low and medium thresholds", () => {
    expect(scoreToTier(0.4)).toBe("low");
    expect(scoreToTier(0.59)).toBe("low");
  });

  it("returns medium for scores between medium and high thresholds", () => {
    expect(scoreToTier(0.6)).toBe("medium");
    expect(scoreToTier(0.84)).toBe("medium");
  });

  it("returns high for scores at or above high threshold", () => {
    expect(scoreToTier(0.85)).toBe("high");
    expect(scoreToTier(1)).toBe("high");
  });

  it("respects custom thresholds", () => {
    const thresholds = { low: 0.3, medium: 0.5, high: 0.7 };
    expect(scoreToTier(0.29, thresholds)).toBe("clean");
    expect(scoreToTier(0.3, thresholds)).toBe("low");
    expect(scoreToTier(0.5, thresholds)).toBe("medium");
    expect(scoreToTier(0.7, thresholds)).toBe("high");
  });
});

describe("toSuspicionScore", () => {
  it("returns score and tier together", () => {
    expect(toSuspicionScore(0.9)).toEqual({ score: 0.9, tier: "high" });
    expect(toSuspicionScore(0.1)).toEqual({ score: 0.1, tier: "clean" });
  });
});
