import { startObserver } from "@/content/observer";
import { injectStyles } from "@/content/styles";

export default defineContentScript({
  matches: ["*://*.reddit.com/*"],
  async main() {
    injectStyles();
    await startObserver();
  },
});
