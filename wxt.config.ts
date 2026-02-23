import { defineConfig } from "wxt";
import preact from "@preact/preset-vite";

export default defineConfig({
  extensionApi: "webextension-polyfill",
  modules: ["@wxt-dev/module-react"],
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
