import { getModelStatus, scoreText, warmUp } from "@/scorer/model";

export default defineBackground(() => {
  // Eagerly load the model so it's cached before any content script messages.
  // Firefox MV2 background scripts persist for the session, so this runs once.
  // The browser Cache API persists model files between sessions — after the
  // first download, subsequent loads are served from cache (no re-download).
  warmUp().catch((err: unknown) => {
    console.warn("[RAF] model warm-up failed:", err);
  });

  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!message || typeof message !== "object") return false;

    const msg = message as Record<string, unknown>;

    if (msg.type === "MODEL_STATUS") {
      sendResponse({ status: getModelStatus() });
      return false;
    }

    if (msg.type !== "SCORE_TEXT") return false;

    const text = msg.text;
    if (typeof text !== "string") {
      sendResponse({ error: "invalid text" });
      return false;
    }

    // Must return true to keep the message channel open for async response
    scoreText(text)
      .then((score) => {
        sendResponse({ score });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[RAF] score error: ${msg}`);
        sendResponse({ error: msg });
      });

    return true;
  });
});
