/**
 * Heuristic corpus tests.
 *
 * Tests heuristicAIScore() against a wide range of human-written and
 * AI-generated text samples. These run in normal `npm test` (no model needed).
 *
 * Thresholds:
 *   0.00       → no signal detected (human text)
 *   0.01–0.24  → weak signal (single isolated tell, insufficient alone)
 *   >= 0.25    → flagged (tier "low" or above, combination of signals)
 *   >= 0.60    → strongly flagged (tier "medium" or above)
 *
 * Single LLM phrases score 0.15 each by design — one isolated "furthermore"
 * does not cross the 0.25 threshold. The heuristic requires corroborating
 * signals to minimise false positives on human writing.
 */
import { describe, expect, it } from "vitest";
import { heuristicAIScore } from "./heuristics";

// ─── Human writing — must score zero (no signals detected) ───────────────────

describe("human writing — no signals (score === 0)", () => {
  it("short reaction comment", () => {
    expect(heuristicAIScore("lmao this is the funniest thing i've seen all week")).toBe(0);
  });

  it("one-word reply", () => {
    expect(heuristicAIScore("same")).toBe(0);
  });

  it("informal disagreement with profanity", () => {
    expect(
      heuristicAIScore(
        "nah that's completely wrong lol. you're ignoring the whole context. like did you even read what they said before commenting"
      )
    ).toBe(0);
  });

  it("typo-laden casual anecdote", () => {
    expect(
      heuristicAIScore(
        "this happend to me omg. i was at the store and jsut completely blanked on my pin number. stood there for like 5 mins while people waited. wanted to die lmao"
      )
    ).toBe(0);
  });

  it("stream-of-consciousness rant", () => {
    expect(
      heuristicAIScore(
        "ok so like i've been thinking about this for a while and i just don't get it. why does everyone act like this is normal? it's not normal. i grew up in a pretty average house and we never did this and i turned out fine. anyway not trying to start drama just genuinely confused"
      )
    ).toBe(0);
  });

  it("short technical answer in plain voice", () => {
    expect(
      heuristicAIScore(
        "you need to set display: flex on the parent, not the child. that's the whole thing. took me ages to figure this out too"
      )
    ).toBe(0);
  });

  it("reddit AITA opener in natural voice", () => {
    expect(
      heuristicAIScore(
        "so basically my sister borrowed my car without asking and put a dent in it and now she's acting like i'm the problem for being upset. i've been stewing on this for days. AITA for telling her she needs to pay for the repair"
      )
    ).toBe(0);
  });

  it("sarcastic comment", () => {
    expect(
      heuristicAIScore(
        "oh sure because that always works out great. definitely no way that could go wrong. sounds like a totally normal thing to do to a coworker"
      )
    ).toBe(0);
  });

  it("someone asking for help informally", () => {
    expect(
      heuristicAIScore(
        "does anyone know if you can freeze cream cheese? asking for a friend (the friend is me, i bought way too much)"
      )
    ).toBe(0);
  });

  it("genuine frustration post", () => {
    expect(
      heuristicAIScore(
        "i have been on hold for 3 hours. THREE. HOURS. just to get told that my account doesn't exist. it clearly exists because you're charging me every month. i am going to lose my mind"
      )
    ).toBe(0);
  });

  it("mixed-case writing with reddit formatting", () => {
    expect(
      heuristicAIScore(
        "Wait actually that's not how it works at all. The API returns a 404 here specifically because the resource is deleted, not missing. Big difference for error handling."
      )
    ).toBe(0);
  });

  it("personal opinion with hedging", () => {
    expect(
      heuristicAIScore(
        "honestly idk, i think people overestimate how much this matters in practice. like yeah in theory you're right but in my experience nobody actually cares about this distinction"
      )
    ).toBe(0);
  });

  it("short news reaction", () => {
    expect(heuristicAIScore("genuinely didn't see this coming. wild week for them honestly")).toBe(
      0
    );
  });

  it("absurdist comedic narrative — cat vs mat", () => {
    expect(
      heuristicAIScore(
        `Mr Biscuits was, by all measurable criteria, an idiot.

He had the physique of a small tiger, the confidence of a lion, and the intellectual capacity of a warm teabag.

One Tuesday afternoon, Mr Biscuits encountered The Mat.

The Mat had lived in the hallway for seven years. It had never moved. It had never made a sound. It had never, to anyone's knowledge, committed a crime.

Mr Biscuits approached it cautiously.

He crouched.

He wiggled his rear.

He slapped it.

The Mat, predictably, did nothing.

Mr Biscuits froze.

This was suspicious.

He slapped it again, harder.

Still nothing.

Clearly, this was an ambush predator of immense skill.

Mr Biscuits decided to outsmart it.

He bit it.

His tooth caught in a loose thread.

He pulled back.

The thread pulled back.

Mr Biscuits panicked.

The Mat, he realised, had him.

He twisted.

The thread tightened.

He rolled.

The Mat rolled with him.

Within seconds, Mr Biscuits had successfully tied himself into what experts would later describe as "a catastrophic textile-based situation".

He screamed.

Not a dignified scream.

A full, high-pitched, "I have made a terrible mistake" scream.

His owner entered the hallway.

Mr Biscuits froze, upside down, one leg in the air, wrapped in The Mat like a badly made burrito.

They looked at him.

He looked at them.

He blinked slowly, as if to say:

"This was your fault."

He was freed.

He walked away immediately.

No gratitude.

No shame.

Five minutes later, he returned and slapped The Mat again.

Just to be sure.`
      )
    ).toBe(0);
  });

  it("long human post without AI tells — personal story", () => {
    expect(
      heuristicAIScore(
        `so i want to preface this by saying i'm not looking for validation, i just need to get this off my chest.

i've been at my job for six years. six years of covering for people, staying late, never complaining. last month they passed me over for a promotion i was basically promised verbally (yeah i know, lesson learned there). gave it to someone who's been here eight months.

i smiled and said congrats to his face. i am not okay. i have been updating my linkedin every night this week. if anyone has advice for someone re-entering the job market after being at one place a long time i'd genuinely appreciate it`
      )
    ).toBe(0);
  });

  it("technical explanation without AI phrasing", () => {
    expect(
      heuristicAIScore(
        `the reason your query is slow is probably the lack of an index on that column. run EXPLAIN ANALYZE on it and look for seq scans on large tables.

also worth checking if your stats are up to date — ANALYZE your tables if they haven't been in a while. sometimes the planner just picks a bad plan because its estimates are way off.`
      )
    ).toBe(0);
  });

  it("heated reddit argument", () => {
    expect(
      heuristicAIScore(
        "you keep moving the goalposts. first it was about the policy, now suddenly it's about implementation? pick one. i've addressed everything you originally raised and you've just shifted to something else"
      )
    ).toBe(0);
  });

  it("human TL;DR without section headers — minimal score only", () => {
    // TL;DR alone without section headers adds only 0.05 — well below "low" tier
    const score = heuristicAIScore(
      "been dealing with this landlord nightmare for 6 months. too long to explain fully. tl;dr he kept my deposit illegally and i finally got it back in small claims"
    );
    expect(score).toBeLessThan(0.25);
  });
});

// ─── Single AI signals — register but stay below "low" tier ──────────────────
// These represent plausible signals that are insufficient on their own.
// Score should be > 0 (the signal fired) but < 0.25 (not flagged alone).

describe("single AI signals — register but insufficient alone (0 < score < 0.25)", () => {
  it("single LLM phrase: delve", () => {
    const score = heuristicAIScore(
      "let's delve into the specifics of this situation and see what we can unpack"
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.25);
  });

  it("single LLM phrase: furthermore", () => {
    const score = heuristicAIScore(
      "the evidence clearly supports this view. Furthermore, multiple studies have confirmed the same pattern across different demographics."
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.25);
  });

  it("single LLM phrase: it's worth noting", () => {
    const score = heuristicAIScore(
      "it's worth noting that this approach has significant limitations that are often overlooked in casual discussions"
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.25);
  });

  it("single LLM phrase: comprehensive overview", () => {
    const score = heuristicAIScore(
      "here's a comprehensive overview of the main points you should consider before making your decision"
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.25);
  });

  it("single LLM phrase: holistic approach", () => {
    const score = heuristicAIScore(
      "what's needed here is a holistic approach that considers all stakeholders and their respective needs"
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.25);
  });

  it("single LLM phrase: key takeaways", () => {
    const score = heuristicAIScore(
      "the key takeaway here is that you need to establish boundaries early in any professional relationship"
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.25);
  });

  it("single LLM phrase: navigate the landscape", () => {
    const score = heuristicAIScore(
      "learning to navigate this landscape effectively requires both technical skill and an understanding of the broader context"
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.25);
  });

  it("moderate em-dash use (2 dashes) — weak signal only", () => {
    // 2 em-dashes score 0.10 — registers but doesn't flag alone
    const score = heuristicAIScore(
      "my manager — who had been there for years — clearly had no idea how to handle the situation and it showed"
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.25);
  });
});

// ─── AI writing — must be flagged (score >= 0.25) ────────────────────────────
// These require two or more corroborating signals.

describe("AI writing — flagged (score >= 0.25)", () => {
  it("narrative section headers — classic reddit slop structure", () => {
    expect(
      heuristicAIScore(
        `The background: I had been working at this company for three years when the incident occurred.

The incident: My manager pulled me aside after a team meeting and made a comment that left me reeling.

The aftermath: I spent the next week second-guessing every interaction. Colleagues noticed I had become withdrawn.

The resolution: After much reflection, I decided to address the issue directly with HR.`
      )
    ).toBeGreaterThanOrEqual(0.25);
  });

  it("TL;DR combined with section headers — strong combined signal", () => {
    expect(
      heuristicAIScore(
        `The situation: My roommate hasn't paid rent in two months despite agreeing to split costs equally.

The context: We've been friends for five years and I didn't want to damage the relationship.

TL;DR: Roommate owes me two months rent, not sure how to handle it without ruining the friendship.`
      )
    ).toBeGreaterThanOrEqual(0.25);
  });

  it("multiple LLM phrases together", () => {
    expect(
      heuristicAIScore(
        "furthermore, it's worth noting that this is a multifaceted issue that requires a holistic approach to navigate effectively"
      )
    ).toBeGreaterThanOrEqual(0.25);
  });

  it("em-dash overuse with LLM phrase — combined signal", () => {
    expect(
      heuristicAIScore(
        "the situation — while complex — requires careful consideration. It's worth noting that my manager — who had been there for years — clearly had no idea how to handle it. The outcome — predictably — was a mess."
      )
    ).toBeGreaterThanOrEqual(0.25);
  });

  it("numbered steps advice post with LLM phrase", () => {
    expect(
      heuristicAIScore(
        `Here are the steps I'd recommend:

1. Start by documenting everything in writing
2. Schedule a formal meeting with your manager
3. Bring a trusted colleague as a witness
4. Follow up with an email summarising the conversation

This approach will significantly enhance your position if things escalate.`
      )
    ).toBeGreaterThanOrEqual(0.25);
  });
});

// ─── Obvious AI — must score >= 0.6 (medium/high tier) ───────────────────────

describe("obvious AI writing — strongly flagged (score >= 0.6)", () => {
  it("full AI Reddit post: AITA narrative with TL;DR and LLM phrases", () => {
    expect(
      heuristicAIScore(
        `I (28F) have been navigating a challenging situation with my coworker (34M) that has significantly impacted my workplace experience.

The background: We have worked together for approximately two years, and our dynamic has always been somewhat fraught. He tends to monopolize meetings and rarely acknowledges the contributions of others.

The incident: Last Tuesday, during our quarterly review, he presented work that I had completed and framed it as a collaborative effort — without mentioning my name once. I was left reeling.

The aftermath: I approached him privately after the meeting. He was dismissive and suggested I was being overly sensitive. Furthermore, he implied that raising the issue would reflect poorly on me.

The current situation: I am considering escalating to HR but am concerned about the potential consequences. It's worth noting that he has been at the company significantly longer than I have.

TL;DR: Coworker took credit for my work, dismissed my concerns, and I'm weighing whether to escalate to HR.`
      )
    ).toBeGreaterThanOrEqual(0.6);
  });

  it("AI advice post with stacked LLM phrases and numbered list", () => {
    expect(
      heuristicAIScore(
        `Great question! There are several key steps you should take to significantly enhance your productivity working from home.

First and foremost, establish a dedicated workspace that is free from distractions. Furthermore, you should develop a structured daily routine.

Here are the key takeaways:
1. Set clear boundaries with family members
2. Use time-blocking techniques to navigate your workload
3. Take regular breaks to maintain focus
4. Invest in quality equipment to transformatively improve your setup

In conclusion, working from home requires a holistic approach that addresses both your physical and mental wellbeing. I hope this comprehensive overview has been helpful!`
      )
    ).toBeGreaterThanOrEqual(0.6);
  });

  it("AI personal narrative with multiple headers, em-dashes, and LLM phrases", () => {
    expect(
      heuristicAIScore(
        `The context: I've been in a relationship for three years — what I thought was a stable and loving partnership.

The discovery: Last week, while helping him set up a new device, I noticed messages that suggested an emotional connection with a mutual friend — one that clearly crossed boundaries.

The confrontation: When I raised this, he was initially defensive. The conversation that followed was — to put it mildly — the most difficult of my life.

The current situation: We are in a period of reflection. It's worth noting that he has been making genuine efforts to address the situation, and I'm trying to approach this with a holistic perspective.

TL;DR: Found evidence of emotional affair, confronted partner, currently working through it.`
      )
    ).toBeGreaterThanOrEqual(0.6);
  });

  it("AI boilerplate with maximum LLM phrase density", () => {
    expect(
      heuristicAIScore(
        "As an AI, I'd be happy to help! Great question. First and foremost, it's worth noting that this is a multifaceted issue. Furthermore, in conclusion, I hope this comprehensive overview has been helpful. Without further ado, let's delve into the key takeaways."
      )
    ).toBeGreaterThanOrEqual(0.6);
  });

  it("AI product review with structured sections and em-dashes", () => {
    expect(
      heuristicAIScore(
        `I recently purchased this item and wanted to share a comprehensive overview of my experience.

The setup: Installation was straightforward — the instructions were clear and the process took approximately twenty minutes.

The performance: In day-to-day use, the device has significantly enhanced my workflow. It's worth noting that battery life exceeds the manufacturer's claims.

The verdict: For anyone looking to navigate the crowded market of similar products, this represents a transformative option. Key takeaways are its reliability, build quality, and value for money.

In summary, I would recommend this without hesitation.`
      )
    ).toBeGreaterThanOrEqual(0.6);
  });

  it("score is capped at 1.0", () => {
    expect(
      heuristicAIScore(
        "Great question! As an AI, I'd be happy to help. First and foremost, in conclusion, furthermore, it's worth noting, I hope this helps. Certainly! Delve into this comprehensive transformative unprecedented holistic paradigm."
      )
    ).toBeLessThanOrEqual(1);
  });
});
