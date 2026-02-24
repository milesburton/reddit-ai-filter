import type { Settings, Stats } from "./types";
import { DEFAULT_SETTINGS, DEFAULT_STATS } from "./types";

const STORAGE_KEY = "raf_settings";

export async function loadSettings(): Promise<Settings> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Partial<Settings> | undefined;
  if (!stored) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    thresholds: {
      ...DEFAULT_SETTINGS.thresholds,
      ...stored.thresholds,
    },
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: settings });
}

export function onSettingsChanged(callback: (settings: Settings) => void): () => void {
  function listener(changes: Record<string, browser.storage.StorageChange>, area: string) {
    if (area !== "local" || !(STORAGE_KEY in changes)) return;
    const next = changes[STORAGE_KEY].newValue as Settings | undefined;
    if (next) callback(next);
  }

  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

const STATS_KEY = "raf_stats";

export async function loadStats(): Promise<Stats> {
  const result = await browser.storage.local.get(STATS_KEY);
  const stored = result[STATS_KEY] as Partial<Stats> | undefined;
  return { ...DEFAULT_STATS, ...stored };
}

export async function incrementStat(tier: keyof Stats): Promise<void> {
  const stats = await loadStats();
  stats[tier]++;
  await browser.storage.local.set({ [STATS_KEY]: stats });
}

export async function resetStats(): Promise<void> {
  await browser.storage.local.set({ [STATS_KEY]: DEFAULT_STATS });
}

export function onStatsChanged(callback: (stats: Stats) => void): () => void {
  function listener(changes: Record<string, browser.storage.StorageChange>, area: string) {
    if (area !== "local" || !(STATS_KEY in changes)) return;
    const next = changes[STATS_KEY].newValue as Stats | undefined;
    if (next) callback(next);
  }

  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
