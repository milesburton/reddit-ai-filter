import { startObserver } from "@/content/observer";
import { injectStyles } from "@/content/styles";
import pkg from "../../package.json";

export default defineContentScript({
  matches: ["*://*.reddit.com/*"],
  async main() {
    console.log(`[RAF] v${pkg.version} loaded`);
    injectStyles();
    await startObserver();
  },
});
