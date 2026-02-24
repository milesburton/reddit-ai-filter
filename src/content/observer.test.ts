import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../settings/types";

// ── Browser API stubs ────────────────────────────────────────────────────────

const mockStorage: Record<string, unknown> = { raf_settings: DEFAULT_SETTINGS };
const mockListeners: Array<
  (changes: Record<string, { newValue?: unknown }>, area: string) => void
> = [];

vi.stubGlobal("browser", {
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
        for (const [k, v] of Object.entries(items)) {
          for (const fn of mockListeners) fn({ [k]: { newValue: v } }, "local");
        }
      }),
    },
    onChanged: {
      addListener: vi.fn((fn: (typeof mockListeners)[number]) => mockListeners.push(fn)),
      removeListener: vi.fn((fn: (typeof mockListeners)[number]) => {
        const i = mockListeners.indexOf(fn);
        if (i !== -1) mockListeners.splice(i, 1);
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
  },
});

// ── Module mocks ─────────────────────────────────────────────────────────────

const mockScoreText = vi.fn<() => Promise<number | null>>();
vi.mock("../scorer/remote", () => ({
  scoreTextViaBackground: mockScoreText,
}));

const mockIncrementStat = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
vi.mock("../settings/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../settings/storage")>();
  return { ...actual, incrementStat: mockIncrementStat };
});

// Import after mocks are set up
const { startObserver } = await import("./observer");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOldRedditComment(bodyText: string): Element {
  const thing = document.createElement("div");
  thing.classList.add("thing");
  thing.dataset.fullname = "t1_abc123";
  thing.dataset.type = "comment";

  const usertext = document.createElement("div");
  usertext.classList.add("usertext-body");
  const md = document.createElement("div");
  md.classList.add("md");
  md.textContent = bodyText;
  usertext.appendChild(md);
  thing.appendChild(usertext);

  document.body.appendChild(thing);
  return thing;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("observer — stat tracking", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockStorage.raf_settings = DEFAULT_SETTINGS;
    mockIncrementStat.mockClear();
    mockScoreText.mockReset();
  });

  it("increments stat when element scores into a non-clean tier", async () => {
    // Score just above the low threshold (0.25)
    mockScoreText.mockResolvedValue(0.5);
    makeOldRedditComment("This comment will be scored as low suspicion by the mock");

    await startObserver();
    // Allow async processElement to complete
    await new Promise((r) => setTimeout(r, 50));

    expect(mockIncrementStat).toHaveBeenCalledWith("low");
  });

  it("increments 'medium' stat for medium-tier scores", async () => {
    mockScoreText.mockResolvedValue(0.75);
    makeOldRedditComment("This comment will score in the medium tier");

    await startObserver();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockIncrementStat).toHaveBeenCalledWith("medium");
  });

  it("increments 'high' stat for high-tier scores", async () => {
    mockScoreText.mockResolvedValue(0.95);
    makeOldRedditComment("This comment will score in the high tier");

    await startObserver();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockIncrementStat).toHaveBeenCalledWith("high");
  });

  it("does not increment stat for clean-tier scores", async () => {
    mockScoreText.mockResolvedValue(0.1);
    makeOldRedditComment("This comment scores clean and should not increment stats");

    await startObserver();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockIncrementStat).not.toHaveBeenCalled();
  });

  it("does not increment stat when scorer returns null", async () => {
    mockScoreText.mockResolvedValue(null);
    makeOldRedditComment("Too short");

    await startObserver();
    await new Promise((r) => setTimeout(r, 50));

    expect(mockIncrementStat).not.toHaveBeenCalled();
  });
});
