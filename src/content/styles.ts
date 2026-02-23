import type { SuspicionTier } from "../scorer/types";

const ATTR = "data-raf-tier";

const CSS = `
/* Debug: outline every scored element so we can confirm detection is running */
[data-raf-score] {
  outline: 2px dashed rgba(100, 100, 255, 0.5) !important;
}

[${ATTR}="clean"] {
  outline: 2px dashed rgba(0, 180, 0, 0.6) !important;
}

[${ATTR}="low"] {
  outline: 2px dashed rgba(200, 160, 0, 0.7) !important;
  border-left: 2px solid rgba(180, 140, 60, 0.35) !important;
}

[${ATTR}="medium"] {
  opacity: 0.45 !important;
  outline: 2px dashed rgba(220, 100, 0, 0.8) !important;
  border-left: 2px solid rgba(180, 140, 60, 0.5) !important;
}

[${ATTR}="high"] {
  outline: 2px dashed rgba(220, 0, 0, 0.9) !important;
  opacity: 0.15 !important;
}
`.trim();

let injected = false;

export function injectStyles(): void {
  if (injected) return;
  const style = document.createElement("style");
  style.id = "raf-styles";
  style.textContent = CSS;
  document.head.appendChild(style);
  injected = true;
}

export function applyTier(el: Element, tier: SuspicionTier): void {
  // Always set the attribute so debug CSS can show "clean" in green.
  // The production CSS has no rule for "clean" so it's a no-op there.
  el.setAttribute(ATTR, tier);
}

export function getTier(el: Element): SuspicionTier | null {
  const val = el.getAttribute(ATTR);
  if (!val) return null;
  return val as SuspicionTier;
}
