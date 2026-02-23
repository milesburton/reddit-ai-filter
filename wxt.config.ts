import preact from "@preact/preset-vite";
import { defineConfig } from "wxt";
import pkg from "./package.json";

export default defineConfig({
  srcDir: "src",
  vite: () => ({
    plugins: [preact()],
  }),
  manifest: {
    name: "Reddit AI Filter",
    description: "Detects and de-emphasises likely AI-generated posts and comments on Reddit.",
    version: pkg.version,
    permissions: ["storage"],
    host_permissions: [
      "*://*.reddit.com/*",
      "*://huggingface.co/*",
      "*://cdn-lfs.huggingface.co/*",
      "*://cdn-lfs-us-1.huggingface.co/*",
    ],
  },
});
