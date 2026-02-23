import { describe, expect, it } from "vitest";
import { heuristicAIScore } from "./heuristics";

describe("heuristicAIScore", () => {
  it("returns 0 for short informal human text", () => {
    const score = heuristicAIScore(
      "lmao same thing happened to my cat last week. little idiot got on the roof"
    );
    expect(score).toBe(0);
  });

  it("returns 0 for informal human opinion", () => {
    const score = heuristicAIScore(
      "honestly the whole discourse around this is exhausting. everyone acts like there's a simple answer but there really isn't. not saying either side is totally right either."
    );
    expect(score).toBe(0);
  });

  it("returns 0 for human anecdote", () => {
    const score = heuristicAIScore(
      "so this happened to me at work yesterday. my boss walks in while im literally eating chips at my desk and just stares at me. i offer him some. he takes some. walks out. never mentioned it again."
    );
    expect(score).toBe(0);
  });

  it("detects obvious AI boilerplate phrases", () => {
    const score = heuristicAIScore(
      "Great question! As an AI language model, I'd be happy to help. First and foremost, it's important to understand the context. In conclusion, I hope this comprehensive overview has been helpful!"
    );
    expect(score).toBeGreaterThan(0.4);
  });

  it("detects LLM narrative section headers", () => {
    const score = heuristicAIScore(
      `The incident: Something happened this morning that changed everything.

The aftermath: I ran outside barefoot, screaming his name.

The current situation: He is now inside but the dynamic has shifted.`
    );
    expect(score).toBeGreaterThan(0.2);
  });

  it("detects numbered list structure", () => {
    const score = heuristicAIScore(
      "Here are the key steps:\n1. Set clear goals\n2. Use time-blocking\n3. Take regular breaks\nBy significantly enhancing your productivity you will see results."
    );
    expect(score).toBeGreaterThanOrEqual(0.1);
  });

  it("caps score at 1", () => {
    const score = heuristicAIScore(
      "Great question! As an AI, I'd be happy to help. First and foremost, in conclusion, furthermore, it's worth noting, I hope this helps. Certainly! Delve into this comprehensive transformative unprecedented holistic paradigm."
    );
    expect(score).toBeLessThanOrEqual(1);
  });
});
