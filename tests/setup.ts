import "@testing-library/jest-dom/vitest";

// Provide env vars so src/lib/config.ts doesn't warn during tests.
(import.meta as unknown as { env: Record<string, string> }).env.VITE_QUIZ_DATA_BASE_URL =
  "https://example.test/data";
(import.meta as unknown as { env: Record<string, string> }).env.VITE_GAS_ENDPOINT =
  "https://example.test/gas";
