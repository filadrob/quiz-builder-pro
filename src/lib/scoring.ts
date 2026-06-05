export const BASE_POINTS = 1000;

export function computePoints(timeRemaining: number, timeLimit: number): number {
  if (timeLimit <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, timeRemaining / timeLimit));
  return Math.round(BASE_POINTS * ratio);
}
