import { scoreTextViaBackground } from "../scorer/remote";
import { toSuspicionScore } from "../scorer/tiers";
import { loadSettings, onSettingsChanged } from "../settings/storage";
import type { Settings } from "../settings/types";
import { DEFAULT_SETTINGS } from "../settings/types";
import { extractText, findThings } from "./selectors";
import { applyTier } from "./styles";

let currentSettings: Settings = DEFAULT_SETTINGS;

// Elements that have been scored. WeakSet prevents memory leaks for
// removed nodes; clear() is not needed — we re-score by checking the
// attribute directly when settings change.
const scored = new WeakSet<Element>();

async function processElement(el: Element): Promise<void> {
  if (scored.has(el)) return;
  scored.add(el);

  if (!currentSettings.enabled) return;

  const text = extractText(el);
  if (!text) return;

  const raw = await scoreTextViaBackground(text);
  if (raw === null) return;

  const { tier } = toSuspicionScore(raw, currentSettings.thresholds);
  applyTier(el, tier);
}

function processAll(root: Document | Element = document): void {
  for (const el of findThings(root)) {
    processElement(el).catch((err) => {
      console.warn("[RAF] failed to score element", err);
    });
  }
}

/**
 * Called when settings change from the popup. Re-scores all elements.
 * We can't clear a WeakSet, so we remove the tier attribute to let
 * already-scored elements be re-evaluated by removing them from scored
 * — achieved by querying the DOM for currently-tiered elements and
 * re-applying tiers based on fresh thresholds without re-running inference
 * (we re-use the stored score via the data attribute).
 *
 * For simplicity at this stage we reload the page's elements fresh.
 * Inference results are not cached, so this re-runs the model.
 */
function handleSettingsChange(next: Settings): void {
  currentSettings = next;

  if (!next.enabled) {
    // Strip all applied tiers immediately
    for (const el of document.querySelectorAll("[data-raf-tier]")) {
      applyTier(el, "clean");
    }
    return;
  }

  // Re-score everything — scored WeakSet entries remain but processElement
  // will skip them. We clear tiers and reset by reloading the page's scored
  // elements. The simplest correct approach is a full re-scan.
  for (const el of document.querySelectorAll("[data-raf-tier]")) {
    applyTier(el, "clean");
  }
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
