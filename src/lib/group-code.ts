// 6-character A-Z + 0-9 code. Excludes easily-confused glyphs (0/O, 1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateGroupCode(): string {
  let out = "";
  const buf = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(buf);
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

export function normalizeGroupCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidGroupCode(input: string): boolean {
  const normalized = normalizeGroupCode(input);
  if (normalized.length !== CODE_LENGTH) return false;
  for (const ch of normalized) {
    if (!ALPHABET.includes(ch)) return false;
  }
  return true;
}
