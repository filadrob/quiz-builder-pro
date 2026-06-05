export const QUIZ_DATA_BASE_URL = import.meta.env.VITE_QUIZ_DATA_BASE_URL as string;
export const GAS_ENDPOINT = import.meta.env.VITE_GAS_ENDPOINT as string;

if (!QUIZ_DATA_BASE_URL || !GAS_ENDPOINT) {
  console.warn("Missing required environment variables. Check .env against .env.example.");
}
