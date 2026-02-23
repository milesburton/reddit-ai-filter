# Reddit AI Filter

A Firefox browser extension that detects likely AI-generated posts and comments on Reddit and progressively de-emphasises them based on a suspicion score.

Detection uses an ensemble of a lightweight ONNX classifier and structural heuristics — the model runs entirely in the browser with no data sent to external servers beyond the initial model download.

---

## How it works

Each post and comment is scored on a scale of 0 to 1, then placed into one of four tiers:

| Tier   | Score      | Visual treatment                  |
|--------|------------|-----------------------------------|
| clean  | < 0.25     | No change                         |
| low    | 0.25–0.59  | Thin left border (subtle hint)    |
| medium | 0.60–0.84  | Reduced to 45% opacity            |
| high   | >= 0.85    | Reduced to 15% opacity            |

Scoring uses two signals in an ensemble:

**ML classifier** — `trentmkelly/slop-detector-mini-2`, a 22M parameter text classifier fine-tuned on Reddit content, running via ONNX/WebAssembly in the background. Only applied to posts of 40 words or more, where it is reliably calibrated.

**Heuristic signals** — a set of zero-false-positive structural detectors that fire on tells common in LLM-generated Reddit posts:
- Narrative section headers ("The incident:", "The aftermath:", "The resolution:")
- Paired TL;DR with structured sections
- LLM tell-tale phrases ("delve", "furthermore", "it's worth noting", "holistic approach", etc.)
- Em-dash overuse
- Unusually uniform sentence length

The final score is the maximum of the two signals — either can raise suspicion independently.

### Model caching

The classifier model (~90 MB) is downloaded once from Hugging Face on first use and cached by the browser's Cache API. Subsequent visits to Reddit load from cache with no network request.

---

## Installation

### Firefox (recommended)

1. Download the latest `.zip` from the [Releases](https://github.com/milesburton/reddit-ai-filter/releases) page.
2. Open `about:debugging` in Firefox.
3. Click "This Firefox" then "Load Temporary Add-on".
4. Select the downloaded `.zip` file.

A permanent release via Firefox Add-ons (AMO) is planned.

### Chrome

Chrome builds are available but not the primary target. Follow the same steps via `chrome://extensions` with "Developer mode" enabled, using the Chrome `.zip` if provided.

---

## Settings

Click the extension icon to open the popup. Three threshold sliders control when each tier activates:

- **Low hint** — minimum score to show a thin border (default 25%)
- **Dim** — minimum score to reduce opacity to 45% (default 60%)
- **Hide** — minimum score to reduce opacity to 15% (default 85%)

The extension can be disabled entirely with the toggle in the popup header.

All settings are stored in `browser.storage.local` and persist between sessions.

---

## Privacy

- No data is transmitted to any server. All scoring happens locally in the browser.
- The model is fetched from Hugging Face on first install (one-time download, then cached).
- No Reddit content is logged or stored beyond what the browser normally handles.

---

## Known limitations

- The ML classifier has elevated false-positive rates on structured technical prose (e.g. detailed how-to comments). The heuristic layer has near-zero false positives and is the primary signal for most detections.
- Detection is probabilistic — a high score indicates likely AI generation, not a certainty. Human writing that happens to use common LLM phrases will occasionally be flagged.
- The extension targets old Reddit (`old.reddit.com`) and new Reddit. Reddit's occasional DOM structure changes may temporarily break element detection until selectors are updated.
- Very short comments (under ~30 characters) are not scored.

---

## Development

### Prerequisites

- [Bun](https://bun.sh) (package manager and runtime)
- Firefox (for testing)

### Setup

```bash
bun install
```

### Development build with hot reload

```bash
bun run dev
```

Then open `about:debugging` in Firefox, load the extension from `.output/firefox-mv2/`.

### Commands

| Command | Description |
|---|---|
| `bun run dev` | Development build with hot reload |
| `bun run build` | Production build for Firefox |
| `bun run build:chrome` | Production build for Chrome |
| `bun run zip` | Build and zip for distribution |
| `bun run test` | Unit tests |
| `bun run test:integration` | Integration tests (downloads model, ~90 MB) |
| `bun run test:coverage` | Unit tests with coverage report |
| `bun run lint` | Biome lint check |
| `bun run typecheck` | TypeScript type check |

### Project structure

```
src/
  content/          # Content script — DOM observer, selectors, tier styling
  entrypoints/      # WXT entry points (background, content, popup)
  scorer/           # Scoring pipeline — ML model, heuristics, tiers
  settings/         # Settings storage and types
```

### Testing

Unit tests cover the heuristic scorer and supporting utilities and run without the model:

```bash
bun run test
```

Integration tests run the full ensemble pipeline against a corpus of human and AI writing samples. These require the ONNX model to download on first run:

```bash
bun run test:integration
```

### Commits

Conventional Commits are enforced via commitlint. Subject lines must be lower-case.

---

## Architecture notes

The extension uses a Firefox MV2 background page (persistent, not a service worker) to host the ONNX model in memory. Content scripts send text to the background via `browser.runtime.sendMessage` and receive a score back, keeping the model away from Reddit's Content Security Policy restrictions.

WXT is used as the extension framework, with Vite for bundling and Preact for the popup UI.

---

## License

MIT
