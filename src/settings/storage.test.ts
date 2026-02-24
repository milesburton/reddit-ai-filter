import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, DEFAULT_STATS } from "./types";

// Mock the browser storage API
const mockStorage: Record<string, unknown> = {};
const mockListeners: Array<
  (changes: Record<string, { newValue?: unknown }>, area: string) => void
> = [];

vi.stubGlobal("browser", {
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({
        [key]: mockStorage[key],
      })),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
      }),
    },
    onChanged: {
      addListener: vi.fn((fn: (typeof mockListeners)[number]) => {
        mockListeners.push(fn);
      }),
      removeListener: vi.fn((fn: (typeof mockListeners)[number]) => {
        const i = mockListeners.indexOf(fn);
        if (i !== -1) mockListeners.splice(i, 1);
      }),
    },
  },
});

// Import after stubbing globals
const {
  loadSettings,
  saveSettings,
  onSettingsChanged,
  loadStats,
  incrementStat,
  resetStats,
  onStatsChanged,
} = await import("./storage");

describe("loadSettings", () => {
  beforeEach(() => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  });

  it("returns defaults when nothing is stored", async () => {
    const settings = await loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("merges stored values over defaults", async () => {
    mockStorage.raf_settings = { enabled: false };
    const settings = await loadSettings();
    expect(settings.enabled).toBe(false);
    expect(settings.thresholds).toEqual(DEFAULT_SETTINGS.thresholds);
  });

  it("merges partial threshold overrides", async () => {
    mockStorage.raf_settings = { thresholds: { high: 0.95 } };
    const settings = await loadSettings();
    expect(settings.thresholds.high).toBe(0.95);
    expect(settings.thresholds.low).toBe(DEFAULT_SETTINGS.thresholds.low);
  });
});

describe("saveSettings", () => {
  it("writes to browser.storage.local", async () => {
    await saveSettings(DEFAULT_SETTINGS);
    expect(browser.storage.local.set).toHaveBeenCalledWith({
      raf_settings: DEFAULT_SETTINGS,
    });
  });
});

describe("onSettingsChanged", () => {
  it("calls callback when raf_settings changes", () => {
    const cb = vi.fn();
    onSettingsChanged(cb);

    const change = { raf_settings: { newValue: { enabled: false } } };
    for (const fn of mockListeners) fn(change, "local");

    expect(cb).toHaveBeenCalledWith({ enabled: false });
  });

  it("ignores changes to other keys", () => {
    const cb = vi.fn();
    onSettingsChanged(cb);

    for (const fn of mockListeners) fn({ other_key: { newValue: "x" } }, "local");
    expect(cb).not.toHaveBeenCalled();
  });

  it("returns an unsubscribe function", () => {
    const cb = vi.fn();
    const unsub = onSettingsChanged(cb);
    unsub();

    for (const fn of mockListeners) fn({ raf_settings: { newValue: DEFAULT_SETTINGS } }, "local");
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("loadStats", () => {
  beforeEach(() => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  });

  it("returns defaults when nothing is stored", async () => {
    const stats = await loadStats();
    expect(stats).toEqual(DEFAULT_STATS);
  });

  it("merges stored values over defaults", async () => {
    mockStorage.raf_stats = { low: 3, medium: 1 };
    const stats = await loadStats();
    expect(stats.low).toBe(3);
    expect(stats.medium).toBe(1);
    expect(stats.high).toBe(0);
  });
});

describe("incrementStat", () => {
  beforeEach(() => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  });

  it("increments the specified tier from zero", async () => {
    await incrementStat("low");
    const stats = await loadStats();
    expect(stats.low).toBe(1);
    expect(stats.medium).toBe(0);
    expect(stats.high).toBe(0);
  });

  it("accumulates across multiple calls", async () => {
    await incrementStat("high");
    await incrementStat("high");
    await incrementStat("medium");
    const stats = await loadStats();
    expect(stats.high).toBe(2);
    expect(stats.medium).toBe(1);
    expect(stats.low).toBe(0);
  });
});

describe("resetStats", () => {
  it("writes DEFAULT_STATS to storage", async () => {
    mockStorage.raf_stats = { low: 5, medium: 3, high: 1 };
    await resetStats();
    const stats = await loadStats();
    expect(stats).toEqual(DEFAULT_STATS);
  });
});

describe("onStatsChanged", () => {
  it("calls callback when raf_stats changes", () => {
    const cb = vi.fn();
    onStatsChanged(cb);

    const change = { raf_stats: { newValue: { low: 2, medium: 0, high: 1 } } };
    for (const fn of mockListeners) fn(change, "local");

    expect(cb).toHaveBeenCalledWith({ low: 2, medium: 0, high: 1 });
  });

  it("ignores changes to other keys", () => {
    const cb = vi.fn();
    onStatsChanged(cb);

    for (const fn of mockListeners) fn({ raf_settings: { newValue: DEFAULT_SETTINGS } }, "local");
    expect(cb).not.toHaveBeenCalled();
  });

  it("returns an unsubscribe function", () => {
    const cb = vi.fn();
    const unsub = onStatsChanged(cb);
    unsub();

    for (const fn of mockListeners) fn({ raf_stats: { newValue: DEFAULT_STATS } }, "local");
    expect(cb).not.toHaveBeenCalled();
  });
});
