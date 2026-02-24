import { scoreTextViaBackground } from "../scorer/remote";
import { toSuspicionScore } from "../scorer/tiers";
import { incrementStat, loadSettings, onSettingsChanged } from "../settings/storage";
import type { Settings } from "../settings/types";
import { DEFAULT_SETTINGS } from "../settings/types";
import { extractText, findThings } from "./selectors";
import { applyTier } from "./styles";

let currentSettings: Settings = DEFAULT_SETTINGS;

// Raw score stored on element so we can re-apply tiers on settings change
// without re-running inference.
const SCORE_ATTR = "data-raf-score";

// Elements currently in-flight (scoring) to avoid duplicate requests.
const inFlight = new WeakSet<Element>();

async function processElement(el: Element): Promise<void> {
  if (inFlight.has(el)) return;

  // If we already have a raw score stored, just re-apply the tier.
  const stored = el.getAttribute(SCORE_ATTR);
  if (stored !== null) {
    if (!currentSettings.enabled) {
      applyTier(el, "clean");
      return;
    }
    const { tier } = toSuspicionScore(Number(stored), currentSettings.thresholds);
    applyTier(el, tier);
    return;
  }

  // First time seeing this element — run inference.
  if (!currentSettings.enabled) return;

  const text = extractText(el);
  if (!text) return;

  inFlight.add(el);
  const raw = await scoreTextViaBackground(text);
  inFlight.delete(el);
  if (raw === null) return;

  el.setAttribute(SCORE_ATTR, String(raw));
  const { tier } = toSuspicionScore(raw, currentSettings.thresholds);
  applyTier(el, tier);
  if (tier !== "clean") {
    incrementStat(tier).catch(() => {});
  }
}

function processAll(root: Document | Element = document): void {
  for (const el of findThings(root)) {
    processElement(el).catch((err) => {
      console.warn("[RAF] failed to score element", err);
    });
  }
}

/**
 * Called when settings change from the popup.
 * - Disabling: strips all tiers immediately.
 * - Re-enabling or threshold change: re-applies tiers from stored scores
 *   (no inference re-run needed) and scans for any unscored elements.
 */
function handleSettingsChange(next: Settings): void {
  currentSettings = next;

  if (!next.enabled) {
    for (const el of document.querySelectorAll("[data-raf-tier]")) {
      applyTier(el, "clean");
    }
    return;
  }

  // Re-apply tiers from stored scores with updated thresholds/enabled state.
  processAll();
}

export async function startObserver(): Promise<void> {
  currentSettings = await loadSettings();

  onSettingsChanged(handleSettingsChange);

  processAll();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        processAll(node as Element);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
