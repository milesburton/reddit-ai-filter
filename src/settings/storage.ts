import type { Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

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

export function onSettingsChanged(
  callback: (settings: Settings) => void
): () => void {
  function listener(
    changes: Record<string, browser.storage.StorageChange>,
    area: string
  ) {
    if (area !== "local" || !(STORAGE_KEY in changes)) return;
    const next = changes[STORAGE_KEY].newValue as Settings | undefined;
    if (next) callback(next);
  }

  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
