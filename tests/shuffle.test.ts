import { describe, it, expect } from "vitest";
import { shuffle } from "@/lib/shuffle";

describe("shuffle", () => {
  it("returns same elements", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = shuffle(arr);
    expect([...result].sort()).toEqual([...arr].sort());
    expect(result).not.toBe(arr);
  });

  it("produces different orderings over many runs (probabilistic)", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const orderings = new Set<string>();
    for (let i = 0; i < 50; i++) orderings.add(shuffle(arr).join(","));
    expect(orderings.size).toBeGreaterThan(1);
  });
});
