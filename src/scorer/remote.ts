/**
 * Asks the background script to score text.
 * The background runs under the extension origin and is not subject to
 * Reddit's CSP, so HuggingFace fetches succeed there.
 */
export async function scoreTextViaBackground(text: string): Promise<number | null> {
  const response = await browser.runtime.sendMessage({
    type: "SCORE_TEXT",
    text,
  });

  if (!response || typeof response !== "object") return null;
  if ("error" in response) {
    console.warn("[RAF] background scorer error:", response.error);
    return null;
  }
  if ("score" in response && response.score === null) return null;
  if ("score" in response && typeof response.score === "number") return response.score;

  return null;
}
