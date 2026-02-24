import { cleanup, render, screen, waitFor } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelStatus } from "@/scorer/model";
import type { Stats } from "@/settings/types";
import { DEFAULT_SETTINGS, DEFAULT_STATS } from "@/settings/types";

// ── Module mocks ──────────────────────────────────────────────────────────────

let mockModelStatus: ModelStatus = { state: "ready" };
let mockStats: Stats = { ...DEFAULT_STATS };
const mockResetStats = vi.fn(async () => {
  mockStats = { ...DEFAULT_STATS };
});
const mockSaveSettings = vi.fn();

let statsChangedCallback: ((s: Stats) => void) | null = null;
const mockOnStatsChanged = vi.fn((cb: (s: Stats) => void) => {
  statsChangedCallback = cb;
  return () => {
    statsChangedCallback = null;
  };
});

vi.mock("@/settings/storage", () => ({
  loadSettings: vi.fn(async () => DEFAULT_SETTINGS),
  saveSettings: mockSaveSettings,
  loadStats: vi.fn(async () => ({ ...mockStats })),
  resetStats: mockResetStats,
  onStatsChanged: mockOnStatsChanged,
}));

vi.stubGlobal("browser", {
  runtime: {
    sendMessage: vi.fn(async () => ({ status: mockModelStatus })),
  },
});

const { Popup } = await import("./components");

afterEach(cleanup);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Popup — stats display", () => {
  beforeEach(() => {
    mockStats = { low: 0, medium: 0, high: 0 };
    mockModelStatus = { state: "ready" };
    statsChangedCallback = null;
  });

  it("shows zero counts on first load", async () => {
    render(<Popup />);

    await waitFor(() => {
      expect(screen.getByText("Flagged this session")).toBeInTheDocument();
    });

    const counts = screen.getAllByText("0");
    expect(counts.length).toBeGreaterThanOrEqual(3);
  });

  it("displays loaded stats correctly", async () => {
    mockStats = { low: 4, medium: 2, high: 1 };
    render(<Popup />);

    await waitFor(() => {
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("resets counts when Reset is clicked", async () => {
    mockStats = { low: 5, medium: 3, high: 1 };
    const user = userEvent.setup();
    render(<Popup />);

    await waitFor(() => expect(screen.getByText("5")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(mockResetStats).toHaveBeenCalled();
    await waitFor(() => {
      const counts = screen.getAllByText("0");
      expect(counts.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("updates live when stats change via storage listener", async () => {
    render(<Popup />);

    await waitFor(() => expect(screen.getByText("Flagged this session")).toBeInTheDocument());

    statsChangedCallback?.({ low: 7, medium: 0, high: 0 });

    await waitFor(() => expect(screen.getByText("7")).toBeInTheDocument());
  });
});

describe("Popup — model status bar", () => {
  it("shows nothing when model is ready", async () => {
    mockModelStatus = { state: "ready" };
    render(<Popup />);

    await waitFor(() => expect(screen.getByText("Flagged this session")).toBeInTheDocument());
    expect(screen.queryByText(/Downloading/)).toBeNull();
    expect(screen.queryByText(/waiting/)).toBeNull();
  });

  it("shows download progress when model is downloading", async () => {
    mockModelStatus = { state: "downloading", progress: 42 };
    render(<Popup />);

    await waitFor(() => expect(screen.getByText(/42%/)).toBeInTheDocument());
  });

  it("shows error message when model errors", async () => {
    mockModelStatus = { state: "error", message: "fetch failed" };
    render(<Popup />);

    await waitFor(() => expect(screen.getByText(/fetch failed/)).toBeInTheDocument());
  });
});

describe("Popup — enabled toggle", () => {
  it("calls saveSettings with enabled: false when toggled off", async () => {
    mockModelStatus = { state: "ready" };
    const user = userEvent.setup();
    render(<Popup />);

    await waitFor(() => expect(screen.getByRole("checkbox")).toBeInTheDocument());
    await user.click(screen.getByRole("checkbox"));

    expect(mockSaveSettings).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});
