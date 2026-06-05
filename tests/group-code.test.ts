import { describe, it, expect } from "vitest";
import { generateGroupCode, normalizeGroupCode, isValidGroupCode } from "@/lib/group-code";

describe("group-code", () => {
  it("generates a 6-character code", () => {
    expect(generateGroupCode()).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("excludes confusable characters (0, O, 1, I)", () => {
    for (let i = 0; i < 200; i++) {
      const c = generateGroupCode();
      expect(c).not.toMatch(/[01OI]/);
    }
  });

  it("produces different codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) codes.add(generateGroupCode());
    expect(codes.size).toBeGreaterThan(90);
  });

  it("normalizes lowercase and trims", () => {
    expect(normalizeGroupCode("  abc123  ")).toBe("ABC123");
  });

  it("strips invalid characters during normalize", () => {
    expect(normalizeGroupCode("a-b c1!2@3")).toBe("ABC123");
  });

  it("isValidGroupCode accepts valid codes", () => {
    expect(isValidGroupCode("ABC234")).toBe(true);
    expect(isValidGroupCode("abc234")).toBe(true);
  });

  it("isValidGroupCode rejects wrong length", () => {
    expect(isValidGroupCode("ABC12")).toBe(false);
    expect(isValidGroupCode("ABC2345")).toBe(false);
  });

  it("isValidGroupCode rejects confusable chars", () => {
    expect(isValidGroupCode("ABC01I")).toBe(false);
  });
});
