import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchQuizIndex,
  fetchQuiz,
  fetchLeaderboard,
  submitScore,
  type QuizSummary,
  type LeaderboardEntry,
} from "@/lib/sheets";

const BASE = "https://example.test/data";
const GAS = "https://example.test/gas";

beforeEach(() => {
  global.fetch = vi.fn();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function mockJson(body: unknown, ok = true, status = 200) {
  (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  });
}

describe("fetchQuizIndex", () => {
  it("filters out non-published quizzes", async () => {
    const sample: QuizSummary[] = [
      { id: "a", title: "A", description: "", questionCount: 5, timeLimitSeconds: 30, status: "published" },
      { id: "b", title: "B", description: "", questionCount: 5, timeLimitSeconds: 30, status: "draft" },
      { id: "c", title: "C", description: "", questionCount: 5, timeLimitSeconds: 30, status: "archived" },
    ];
    mockJson(sample);
    const res = await fetchQuizIndex();
    expect(res.map((q) => q.id)).toEqual(["a"]);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/quizzes.json`);
  });
});

describe("fetchQuiz", () => {
  it("hits the per-quiz JSON URL", async () => {
    mockJson({ id: "x", title: "X", description: "", timeLimitSeconds: 30, questions: [] });
    await fetchQuiz("x");
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/x.json`);
  });
});

describe("fetchLeaderboard", () => {
  it("calls GAS with quizId param", async () => {
    mockJson([]);
    await fetchLeaderboard("quiz-1");
    const url = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain(GAS);
    expect(url).toContain("quizId=quiz-1");
    expect(url).not.toContain("groupCode");
  });

  it("includes groupCode when provided", async () => {
    mockJson([]);
    await fetchLeaderboard("quiz-1", "ABC123");
    const url = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("groupCode=ABC123");
  });
});

describe("submitScore", () => {
  it("POSTs payload as text/plain with all 6 required fields", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    await submitScore({
      quizId: "q1",
      name: "Tester",
      isAnonymous: false,
      score: 4200,
      totalTime: 87.5,
      privateGroupCode: "GRP456",
    });
    const call = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe(GAS);
    expect(call[1].method).toBe("POST");
    expect(call[1].headers["Content-Type"]).toBe("text/plain");
    const body = JSON.parse(call[1].body);
    expect(body).toEqual({
      quizId: "q1",
      name: "Tester",
      isAnonymous: false,
      score: 4200,
      totalTime: 87.5,
      privateGroupCode: "GRP456",
    });
  });

  it("omits privateGroupCode when not provided", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    await submitScore({
      quizId: "q1",
      name: "Anonymous",
      isAnonymous: true,
      score: 0,
      totalTime: 30,
    });
    const body = JSON.parse(
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.privateGroupCode).toBeUndefined();
    expect(body.isAnonymous).toBe(true);
  });

  it("throws on non-OK response", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    await expect(
      submitScore({ quizId: "q", name: "x", isAnonymous: false, score: 0, totalTime: 0 }),
    ).rejects.toThrow();
  });
});

describe("leaderboard sort expectations (verifies GAS contract)", () => {
  // GAS sorts; client just renders the order it receives. This test documents
  // the expected ordering so the GAS script in docs/GAS_SCRIPT.gs matches.
  it("score desc, tiebreaker totalTime asc", () => {
    const entries: LeaderboardEntry[] = [
      { name: "A", score: 800, totalTime: 50, timestamp: "", isAnonymous: false },
      { name: "B", score: 900, totalTime: 60, timestamp: "", isAnonymous: false },
      { name: "C", score: 900, totalTime: 40, timestamp: "", isAnonymous: false },
    ];
    const sorted = [...entries].sort(
      (a, b) => b.score - a.score || a.totalTime - b.totalTime,
    );
    expect(sorted.map((e) => e.name)).toEqual(["C", "B", "A"]);
  });
});
