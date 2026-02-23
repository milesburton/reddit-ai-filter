import { beforeEach, describe, expect, it } from "vitest";
import { applyTier, getTier } from "./styles";

describe("applyTier / getTier", () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement("div");
  });

  it("sets data-raf-tier attribute for non-clean tiers", () => {
    applyTier(el, "low");
    expect(el.getAttribute("data-raf-tier")).toBe("low");

    applyTier(el, "medium");
    expect(el.getAttribute("data-raf-tier")).toBe("medium");

    applyTier(el, "high");
    expect(el.getAttribute("data-raf-tier")).toBe("high");
  });

  it("sets attribute to 'clean' for clean tier", () => {
    el.setAttribute("data-raf-tier", "medium");
    applyTier(el, "clean");
    expect(el.getAttribute("data-raf-tier")).toBe("clean");
  });

  it("getTier reads back the tier", () => {
    applyTier(el, "medium");
    expect(getTier(el)).toBe("medium");
  });

  it("getTier returns null when no tier set", () => {
    expect(getTier(el)).toBeNull();
  });
});
