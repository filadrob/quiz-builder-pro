import { LEADERBOARD_APPS_SCRIPT_URL } from "./config";

export interface SubmitScorePayload {
  quizId: string;
  participantName: string;
  totalScore: number;
  totalTime: number;
}

export async function submitScore(payload: SubmitScorePayload): Promise<void> {
  // Apps Script Web Apps typically don't return permissive CORS headers, so we
  // POST as text/plain (a "simple" request) to avoid a preflight. The Apps
  // Script reads the raw body with JSON.parse(e.postData.contents).
  const res = await fetch(LEADERBOARD_APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Leaderboard submit failed: ${res.status}`);
  }
}
