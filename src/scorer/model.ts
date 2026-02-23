import type { TextClassificationPipeline } from "@xenova/transformers";
import { heuristicAIScore } from "./heuristics";

const MODEL_ID = "trentmkelly/slop-detector-mini-2";
const LLM_LABEL = "llm";

/**
 * Minimum word count before the classifier is trusted.
 * The slop-detector has high false-positive rates on short informal text
 * (it flags casual human writing as AI). Below this threshold we rely
 * solely on heuristics, which have near-zero false positives.
 */
const CLASSIFIER_MIN_WORDS = 40;

let pipeline: TextClassificationPipeline | null = null;

async function getPipeline(): Promise<TextClassificationPipeline> {
  if (pipeline) return pipeline;

  const { pipeline: createPipeline, env } = await import("@xenova/transformers");

  // Disable local model path lookup — extension context has no local filesystem.
  // Force all model files to be fetched from the Hugging Face CDN.
  env.allowLocalModels = false;
  env.allowRemoteModels = true;

  console.log(`[RAF] loading model: ${MODEL_ID}`);
  pipeline = (await createPipeline("text-classification", MODEL_ID)) as TextClassificationPipeline;
  console.log("[RAF] model ready");

  return pipeline;
}

/**
 * Strips noise that shouldn't be scored: quoted text, spoilers, URLs.
 * Preserves newlines so structure-based heuristics can still fire.
 */
function stripNoise(raw: string): string {
  return raw
    .replace(/^>.*$/gm, "") // blockquotes
    .replace(/&gt;.*$/gm, "") // HTML-encoded blockquotes
    .replace(/!\[.*?\]\(.*?\)/g, "") // markdown images
    .replace(/\[.*?\]\(.*?\)/g, "") // markdown links
    .replace(/https?:\/\/\S+/g, "") // bare URLs
    .trim();
}

/**
 * Full preprocessing for the ML classifier: collapses whitespace to a
 * single line suitable for a sequence classification model.
 */
export function preprocessText(raw: string): string {
  return stripNoise(raw)
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Pre-loads the model so it is cached before the first scoring request. */
export async function warmUp(): Promise<void> {
  await getPipeline();
}

/**
 * Returns a raw suspicion score (0–1) for the given text using an ensemble
 * of the ML classifier and lightweight heuristics.
 *
 * Returns null if the text is too short to score reliably.
 *
 * Ensemble logic:
 * - Heuristics fire on structural LLM tells (section headers, tell-tale phrases,
 *   em-dash overuse) with near-zero false positives.
 * - The ML classifier is gated to long-form text (≥40 words) where it is
 *   calibrated correctly; on short informal text it has high false-positive rates.
 * - Final score = max(classifierScore, heuristicScore) so either signal can flag.
 */
export async function scoreText(text: string): Promise<number | null> {
  // Strip noise but keep newlines — heuristics need structural formatting
  const stripped = stripNoise(text);
  if (stripped.length < 30) return null;

  // Collapse whitespace for the classifier
  const cleaned = stripped.replace(/\s{2,}/g, " ").trim();
  const wordCount = cleaned.split(/\s+/).length;

  // Heuristics run on the newline-preserved text so section headers,
  // list structure, etc. are still detectable
  const heuristic = heuristicAIScore(stripped);

  // Only run the classifier on longer text where it is reliable
  let classifierScore = 0;
  if (wordCount >= CLASSIFIER_MIN_WORDS) {
    const pipe = await getPipeline();
    const result = await pipe(cleaned, { truncation: true, max_length: 512 } as Record<
      string,
      unknown
    >);
    const output = (Array.isArray(result) ? result[0] : result) as { label: string; score: number };
    classifierScore = output.label === LLM_LABEL ? output.score : 1 - output.score;
  }

  // Ensemble: either signal can raise suspicion
  const ensemble = Math.max(classifierScore, heuristic);
  console.log(
    `[RAF] score: classifier=${classifierScore.toFixed(3)} heuristic=${heuristic.toFixed(3)} ensemble=${ensemble.toFixed(3)} words=${wordCount}`
  );
  return ensemble;
}
