import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./types";

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
const { loadSettings, saveSettings, onSettingsChanged } = await import("./storage");

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
