import type { SuspicionTier } from "../scorer/types";

const ATTR = "data-raf-tier";

const CSS = `
[${ATTR}="low"] {
  border-left: 2px solid rgba(180, 140, 60, 0.35) !important;
}

[${ATTR}="medium"] {
  opacity: 0.45 !important;
  border-left: 2px solid rgba(180, 140, 60, 0.5) !important;
}

[${ATTR}="high"] {
  display: none !important;
}

/* Collapsed placeholder shown in place of hidden items */
[${ATTR}="high"]::before {
  display: block !important;
  content: "" !important;
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
  if (tier === "clean") {
    el.removeAttribute(ATTR);
  } else {
    el.setAttribute(ATTR, tier);
  }
}

export function getTier(el: Element): SuspicionTier | null {
  const val = el.getAttribute(ATTR);
  if (!val) return null;
  return val as SuspicionTier;
}
