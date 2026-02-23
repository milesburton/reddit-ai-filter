/**
 * Heuristic signals for AI-generated text detection.
 *
 * These complement the ML classifier for text that stylistically resembles
 * human writing but carries structural tells of LLM generation — e.g. narrative
 * posts with labelled sections ("The incident:", "The aftermath:") or excessive
 * use of em-dashes and transition phrases.
 *
 * Returns a score in [0, 1] where 1 = very likely AI.
 * Returns 0 for text with no detectable signals (no false positives by design).
 */
export function heuristicAIScore(text: string): number {
  let score = 0;

  // 1. LLM tell-tale phrases — high-precision signal
  const llmPhrases = [
    /\bas an ai\b/i,
    /\bi'?d be happy to\b/i,
    /\bgreat question\b/i,
    /\bcertainly[!,]?\s/i,
    /\bin conclusion\b/i,
    /\bfurthermore\b/i,
    /\bit'?s worth noting\b/i,
    /\bin summary\b/i,
    /\bfirst and foremost\b/i,
    /\bi hope this helps\b/i,
    /\bcomprehensive overview\b/i,
    /\bkey takeaways?\b/i,
    /\bmultifaceted\b/i,
    /\bsignificantly enhance\b/i,
    /\bwithout further ado\b/i,
    /\bdelve\b/i,
    /\bunprecedented\b/i,
    /\btransformative\b/i,
    /\bnavigate\b.*\blandscape\b/is,
    /\bholistic approach\b/i,
    /\bseminal\b/i,
    /\bparadigm\b/i,
  ];
  const phraseHits = llmPhrases.filter((r) => r.test(text)).length;
  if (phraseHits > 0) {
    score += Math.min(phraseHits * 0.15, 0.6);
  }

  // 2. Narrative section headers — LLMs love labelled sections like
  //    "The incident:", "The aftermath:", "The solution:"
  //    Match Title-case phrase at line-start OR after a sentence boundary.
  const sectionHeaders = (text.match(/(?:^|[.!?]\s+|\n)[A-Z][a-z]+(?: [a-z]+){0,3}:/gm) ?? [])
    .length;
  if (sectionHeaders >= 2) {
    score += Math.min(sectionHeaders * 0.12, 0.35);
  }

  // 3. Em-dash overuse — LLMs reach for — far more than humans do
  const words = text.split(/\s+/).length;
  const emDashes = (text.match(/—/g) ?? []).length;
  if (words > 20 && emDashes >= 2) {
    // Scale: 2 em-dashes → +0.1, 4+ → +0.2
    score += Math.min(emDashes * 0.05, 0.2);
  }

  // 4. Sentence length uniformity — LLMs produce suspiciously even cadences
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length > 5);
  if (sentences.length >= 5) {
    const lengths = sentences.map((s) => s.split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length;
    const cv = Math.sqrt(variance) / mean; // coefficient of variation
    if (cv < 0.25) {
      score += 0.2;
    }
  }

  // 5. Numbered or bulleted list structure
  if (/^\s*(?:\d+[.)]\s|\*\s|- )/m.test(text)) {
    score += 0.1;
  }

  return Math.min(score, 1);
}
