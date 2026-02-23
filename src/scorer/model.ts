import type { TextClassificationPipeline } from "@xenova/transformers";

const MODEL_ID = "trentmkelly/slop-detector-mini-2";
const LLM_LABEL = "llm";

let pipeline: TextClassificationPipeline | null = null;

async function getPipeline(): Promise<TextClassificationPipeline> {
  if (pipeline) return pipeline;

  const { pipeline: createPipeline } = await import("@xenova/transformers");
  pipeline = (await createPipeline(
    "text-classification",
    MODEL_ID
  )) as TextClassificationPipeline;

  return pipeline;
}

/**
 * Strips elements that shouldn't be scored: quoted text, spoilers, URLs.
 * Keeps only the author's own words.
 */
export function preprocessText(raw: string): string {
  return raw
    .replace(/^>.*$/gm, "") // blockquotes
    .replace(/&gt;.*$/gm, "") // HTML-encoded blockquotes
    .replace(/!\[.*?\]\(.*?\)/g, "") // markdown images
    .replace(/\[.*?\]\(.*?\)/g, "") // markdown links
    .replace(/https?:\/\/\S+/g, "") // bare URLs
    .replace(/\s{2,}/g, " ") // collapse whitespace
    .trim();
}

/**
 * Returns a raw suspicion score (0–1) for the given text.
 * Returns null if the text is too short to score reliably.
 */
export async function scoreText(text: string): Promise<number | null> {
  const cleaned = preprocessText(text);

  // Too short to score reliably — skip rather than guess
  if (cleaned.length < 30) return null;

  const pipe = await getPipeline();
  const result = await pipe(cleaned, { truncation: true, max_length: 512 });

  const output = Array.isArray(result) ? result[0] : result;

  if (output.label === LLM_LABEL) {
    return output.score;
  }

  // Human label — invert so score always represents AI suspicion
  return 1 - output.score;
}
