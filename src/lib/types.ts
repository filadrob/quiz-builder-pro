// Domain types now live in src/lib/sheets.ts (alongside the fetchers).
// Re-exported here for backwards compatibility with existing imports.
export type {
  Choice,
  Question,
  Quiz,
  QuizSummary,
  LeaderboardEntry,
  ScoreSubmission,
} from "./sheets";

export type ChoiceType = "text" | "image";

// Backwards-compatible alias; prefer QuizSummary.
export type { QuizSummary as QuizIndexEntry } from "./sheets";

// Per-question answer record collected during a session.
export interface AnswerRecord {
  questionId: string;
  selectedChoiceIndex: number | null; // null = timeout/skip
  correct: boolean;
  timeRemaining: number;
  responseTime: number;
  points: number;
  skipped: boolean;
  timedOut: boolean;
}
