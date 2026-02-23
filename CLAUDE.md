# Reddit AI Filter — Project Context

A Firefox extension that detects likely AI-generated content on Reddit and de-emphasises or hides it, using a suspicion-scoring approach rather than binary classification.

---

## Background

Inspired by [reddit-llm-comment-detector](https://github.com/trentmkelly/reddit-llm-comment-detector), which demonstrated the concept but has significant limitations:
- Trained on raw, unedited LLM API outputs vs. real Reddit comments — not representative of real-world AI slop
- No adversarial robustness (light paraphrasing defeats it)
- Disruptive UI (orange overlays, badges, percentages) — too overt
- Static training data that doesn't keep up with evolving LLM output styles

This project aims to be more subtle, more robust, and better designed.

---

## Core Design Principles

1. **Suspicion scoring, not binary detection** — content gets a 0–1 score; thresholds determine visual treatment
2. **Near-transparent UI** — users who don't know the extension is installed shouldn't notice anything alien
3. **Conservative defaults** — bias toward false negatives over false positives; don't wrongly hide real content
4. **RES compatible** — must coexist with Reddit Enhancement Suite without DOM conflicts
5. **Fully client-side** — no API calls during inference, no telemetry, no data leaves the browser

---

## Visual Treatment (Suspicion Tiers)

| Score | Treatment |
|---|---|
| High (e.g. >0.85) | Hidden — collapsed using Reddit's own collapse pattern |
| Medium (e.g. 0.6–0.85) | Dimmed — reduced opacity (~40–50%) |
| Low (e.g. 0.4–0.6) | Subtle cue — thin muted left border only |
| Clean (<0.4) | Untouched |

Thresholds are user-configurable via the popup UI.

---

## Architecture

### Two Distinct Concerns

**1. Content Script** (runs on Reddit pages)
- Vanilla TypeScript — no framework
- Uses MutationObserver to handle dynamic DOM (new Reddit SPA, RES lazy-loading)
- Targets stable Reddit attributes (`data-fullname`, `thing_id`) not class names (which RES modifies)
- Applies styles to wrapper elements, not inner nodes RES touches
- Imports shared scoring module

**2. Popup UI** (extension settings panel)
- Preact + plain CSS/CSS Modules
- Threshold sliders, enable/disable toggle, whitelist controls
- Communicates with content script via browser extension messaging

### Shared Module
- `scorer.ts` — text preprocessing, model inference, score normalisation
- Imported by both content script and test suite
- Runs Transformers.js (ONNX model) in Node.js for testing, browser for production

---

## Tech Stack

| Concern | Tool | Rationale |
|---|---|---|
| Package manager / scripts | Bun | Fast, modern |
| Extension bundling | WXT | Extension-specific Vite framework, handles multi-entry-point complexity, Firefox first-class support, `wxt dev -b firefox` for hot reload |
| Testing | Vitest + jsdom | Fast, integrates with Vite, DOM testing without a browser |
| Linting / formatting | Biome (`biome.json`) | Fast, opinionated, single tool for both lint and format |
| Popup UI | Preact | 3KB vs React's 45KB, identical API |
| Content script | Vanilla TypeScript | No framework needed for DOM observation + style application |
| Styling (popup) | Plain CSS / CSS Modules | Popup is simple enough not to need Tailwind |
| Styling (content script) | Single injected stylesheet | Scoped to avoid conflicts with Reddit/RES styles |
| ML inference | Transformers.js (ONNX) | Client-side, no server needed, Node.js compatible for testing |
| Git hooks | Husky | Pre-commit: biome check + typecheck + tests. Commit-msg: commitlint |
| Commit convention | Conventional Commits (`commitlint.config.ts`) | Types: feat, fix, docs, style, refactor, perf, test, chore, revert, ci |

## Key Scripts

```
bun run dev           # launch Firefox with hot-reloading extension (wxt -b firefox)
bun run build         # production build → .output/
bun run zip           # build + zip for AMO submission
bun run test          # vitest run (single pass)
bun run test:watch    # vitest watch mode
bun run check         # biome check --write (lint + format autofix)
bun run typecheck     # tsc --noEmit
```

---

## Detection Approach

### Primary Signal — ML Classifier
- Fine-tuned BERT-style model (start with `trentmkelly/slop-detector-mini-2` as baseline)
- Run via Transformers.js in browser (WASM/ONNX)
- Key weakness of existing model: trained on clean LLM outputs, not humanised/edited AI text

### Complementary Signals (to combine with ML score)
- Account age relative to posting volume
- Near-identical text posted across subreddits
- Post timing patterns
- Comment length distribution (AI tends toward consistent medium-length responses)

### Known Limitations
- No classifier reliably detects well-prompted, lightly-edited LLM output — this is an unsolved research problem
- False positive risk for non-native English speakers
- Static training data becomes stale as LLM writing styles evolve
- Extension should frame output as suspicion, not accusation

---

## RES Compatibility

- Use MutationObserver (not one-shot `querySelectorAll`) so new nodes added by RES are caught
- Target `data-fullname` / `thing_id` attributes, not class names
- Apply styles to outermost comment wrapper, not inner nodes RES manipulates
- Test against old Reddit + RES (primary audience) and new Reddit separately

---

## Testing Strategy

| Layer | Tool | Approach |
|---|---|---|
| Scoring logic | Vitest | Pure functions, no browser needed |
| Model inference | Vitest + Transformers.js (Node) | Curated human vs AI comment fixtures |
| DOM / content script | Vitest + jsdom | Saved Reddit HTML snapshots as fixtures |
| E2E | Playwright | Load extension against local HTML fixtures |
| Manual | WXT dev mode | `wxt dev -b firefox` for live iteration |

Fixtures should include:
- Known human-written Reddit comments
- Known AI-generated comments (including humanised/edited ones)
- Edge cases: short comments, heavy quoting, non-native English, code snippets

---

## CI/CD (GitHub Actions)

| Trigger | Jobs |
|---|---|
| Every PR | Biome check, Vitest, WXT build verification |
| Merge to main | Above + build artifact uploaded |
| Tag push (`v*`) | Build + zip attached to GitHub Release |

Mozilla's `web-ext sign` API can automate AMO submission from CI for the full pipeline.

---

## Firefox Store Publishing (AMO)

1. Developer account at addons.mozilla.org
2. Source code submission required alongside minified build (WXT generates correct source zip)
3. Manifest V3 — Firefox support differs slightly from Chrome; WXT abstracts most of this
4. Initial review: days to weeks. Updates to approved extensions are faster
5. Self-distribution signing available for faster iteration outside store review

---

## Reference Projects

- [reddit-llm-comment-detector](https://github.com/trentmkelly/reddit-llm-comment-detector) — original inspiration, Chrome/Firefox extension, same Transformers.js approach
- [slop-detector-mini-2](https://huggingface.co/trentmkelly/slop-detector-mini-2) — baseline model to start from
- [gpt-slop-2 dataset](https://huggingface.co/datasets/trentmkelly/gpt-slop-2) — training data used by baseline model
- [WXT docs](https://wxt.dev) — extension framework
- [Transformers.js docs](https://huggingface.co/docs/transformers.js) — browser ML inference

---

## Open Questions / Future Work

- Better training data: curated dataset of humanised/edited AI outputs, not raw API responses
- User feedback loop: "not AI" button on dimmed content to gather false positive signal
- Subreddit-specific tuning: some subreddits have more AI content than others
- Chrome port: WXT supports both, but Firefox is the primary target
- Behavioural signals: account age, cross-subreddit duplicate posting, timing patterns
