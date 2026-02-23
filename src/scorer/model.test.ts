import { describe, expect, it } from "vitest";
import { preprocessText } from "./model";

// Note: scoreText requires the ONNX model download and is tested via
// integration fixtures. preprocessText is pure and testable in isolation.

describe("preprocessText", () => {
  it("removes blockquotes", () => {
    const input = "> someone said this\nActual reply here";
    expect(preprocessText(input)).toBe("Actual reply here");
  });

  it("removes HTML-encoded blockquotes", () => {
    const input = "&gt; quoted text\nOriginal content";
    expect(preprocessText(input)).toBe("Original content");
  });

  it("removes bare URLs", () => {
    const input = "Check this out https://example.com for more info";
    expect(preprocessText(input)).toBe("Check this out for more info");
  });

  it("removes markdown links", () => {
    const input = "See [this article](https://example.com) for details";
    expect(preprocessText(input)).toBe("See for details");
  });

  it("collapses excess whitespace", () => {
    const input = "Hello    world\n\n\nfoo";
    expect(preprocessText(input)).toBe("Hello world foo");
  });

  it("returns empty string for quote-only comments", () => {
    const input = "> all of this\n> is quoted";
    expect(preprocessText(input)).toBe("");
  });
});
