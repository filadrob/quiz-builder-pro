import { QUIZ_DATA_BASE_URL, GAS_ENDPOINT } from "./config";

// --- Types ---

export type QuizSummary = {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimitSeconds: number;
  status: "draft" | "published" | "archived";
  isModified?: boolean;
};

export type Choice = {
  type: "text" | "image";
  value: string;
};

export type Question = {
  id: string;
  imageUrl: string;
  textFallback: string;
  choices: Choice[];
  correctChoiceIndex: number;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  timeLimitSeconds: number;
  isModified?: boolean;
  questions: Question[];
};

export type LeaderboardEntry = {
  name: string;
  score: number;
  totalTime: number;
  timestamp: string;
  isAnonymous: boolean;
};

export type ScoreSubmission = {
  quizId: string;
  name: string;
  isAnonymous: boolean;
  score: number;
  totalTime: number;
  privateGroupCode?: string;
};

// --- Quiz Index ---

export async function fetchQuizIndex(): Promise<QuizSummary[]> {
  const res = await fetch(`${QUIZ_DATA_BASE_URL}/quizzes.json`);
  if (!res.ok) throw new Error(`Failed to fetch quiz index: ${res.status}`);
  const data: QuizSummary[] = await res.json();
  return data.filter((q) => q.status === "published");
}

// --- Individual Quiz ---

export async function fetchQuiz(quizId: string): Promise<Quiz> {
  const res = await fetch(`${QUIZ_DATA_BASE_URL}/${quizId}.json`);
  if (!res.ok) throw new Error(`Failed to fetch quiz ${quizId}: ${res.status}`);
  return res.json();
}

// --- Leaderboard Read ---

export async function fetchLeaderboard(
  quizId: string,
  groupCode?: string,
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams({ quizId });
  if (groupCode) params.set("groupCode", groupCode);
  const res = await fetch(`${GAS_ENDPOINT}?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch leaderboard: ${res.status}`);
  return res.json();
}

// --- Score Write ---

export async function submitScore(submission: ScoreSubmission): Promise<void> {
  const res = await fetch(GAS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(submission),
  });
  if (!res.ok) throw new Error(`Failed to submit score: ${res.status}`);
}
