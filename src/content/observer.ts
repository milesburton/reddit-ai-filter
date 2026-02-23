import { scoreText } from "../scorer/model";
import { toSuspicionScore } from "../scorer/tiers";
import { DEFAULT_THRESHOLDS } from "../scorer/types";
import { extractText, findThings } from "./selectors";
import { applyTier } from "./styles";

// Tracks elements already scored so we don't re-score on DOM updates
const scored = new WeakSet<Element>();

async function processElement(el: Element): Promise<void> {
  if (scored.has(el)) return;
  scored.add(el);

  const text = extractText(el);
  if (!text) return;

  const raw = await scoreText(text);
  if (raw === null) return;

  const { tier } = toSuspicionScore(raw, DEFAULT_THRESHOLDS);
  applyTier(el, tier);
}

function processAll(root: Document | Element = document): void {
  for (const el of findThings(root)) {
    // Fire and forget — errors are logged but don't block other elements
    processElement(el).catch((err) => {
      console.warn("[RAF] failed to score element", err);
    });
  }
}

export function startObserver(): void {
  // Score elements already on the page
  processAll();

  // Watch for new elements added by Reddit's SPA navigation or RES
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = node as Element;
        // Score the node itself if it's a thing, or scan its subtree
        processAll(el);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
