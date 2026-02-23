import preact from "@preact/preset-vite";
import { defineConfig } from "wxt";

export default defineConfig({
  extensionApi: "webextension-polyfill",
  srcDir: "src",
  vite: () => ({
    plugins: [preact()],
  }),
  manifest: {
    name: "Reddit AI Filter",
    description:
      "Detects and de-emphasises likely AI-generated posts and comments on Reddit.",
    version: "0.1.0",
    permissions: ["storage"],
    host_permissions: ["*://*.reddit.com/*"],
  },
});
