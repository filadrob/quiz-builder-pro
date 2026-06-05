import { SHEETS_API_KEY, QUIZ_INDEX_SHEET_ID, QUIZ_INDEX_RANGE } from "./config";
import type { QuizIndexEntry, LeaderboardEntry } from "./types";

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

interface ValuesResponse {
  range?: string;
  majorDimension?: string;
  values?: string[][];
}

async function fetchRange(sheetId: string, range: string): Promise<string[][]> {
  const url = `${SHEETS_BASE}/${sheetId}/values/${range}?key=${SHEETS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sheets API ${res.status}: ${text || res.statusText}`);
  }
  const data = (await res.json()) as ValuesResponse;
  return data.values ?? [];
}

export async function fetchQuizIndex(): Promise<QuizIndexEntry[]> {
  const rows = await fetchRange(QUIZ_INDEX_SHEET_ID, QUIZ_INDEX_RANGE);
  return rows
    .filter((r) => r[0] && r[5])
    .map((r) => ({
      id: String(r[0] ?? "").trim(),
      title: String(r[1] ?? "").trim(),
      description: String(r[2] ?? "").trim(),
      questionCount: Number(r[3] ?? 0) || 0,
      timeLimitSeconds: Number(r[4] ?? 0) || 0,
      jsonUrl: String(r[5] ?? "").trim(),
    }));
}

export async function fetchLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
  // Leaderboard rows live in a tab named exactly after the quiz id in the
  // SAME spreadsheet as the quiz index. Apps Script writes them there.
  const range = `'${quizId}'!A2:D`;
  let rows: string[][] = [];
  try {
    rows = await fetchRange(QUIZ_INDEX_SHEET_ID, range);
  } catch (err) {
    // Tab may not exist yet — treat as empty leaderboard.
    if (err instanceof Error && /400|Unable to parse range/i.test(err.message)) {
      return [];
    }
    throw err;
  }
  const entries: LeaderboardEntry[] = rows
    .filter((r) => r.length > 0)
    .map((r) => ({
      participantName: String(r[0] ?? "Anonymous"),
      totalScore: Number(r[1] ?? 0) || 0,
      totalTime: Number(r[2] ?? 0) || 0,
      submittedAt: String(r[3] ?? ""),
    }));
  entries.sort((a, b) => b.totalScore - a.totalScore || a.totalTime - b.totalTime);
  return entries;
}
