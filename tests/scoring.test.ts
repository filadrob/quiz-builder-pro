import { describe, it, expect } from "vitest";
import { computePoints, BASE_POINTS } from "@/lib/scoring";

describe("computePoints", () => {
  it("spec: 15s remaining of 30s = 500 points", () => {
    expect(computePoints(15, 30)).toBe(500);
  });

  it("full time remaining = max points", () => {
    expect(computePoints(30, 30)).toBe(BASE_POINTS);
  });

  it("zero time remaining = 0 points", () => {
    expect(computePoints(0, 30)).toBe(0);
  });

  it("clamps negative remaining to 0", () => {
    expect(computePoints(-5, 30)).toBe(0);
  });

  it("clamps remaining > limit to full points", () => {
    expect(computePoints(60, 30)).toBe(BASE_POINTS);
  });

  it("returns 0 when timeLimit is 0", () => {
    expect(computePoints(10, 0)).toBe(0);
  });

  it("short limit (5s) — 2.5s remaining = 500", () => {
    expect(computePoints(2.5, 5)).toBe(500);
  });

  it("long limit (120s) — 60s remaining = 500", () => {
    expect(computePoints(60, 120)).toBe(500);
  });
});
