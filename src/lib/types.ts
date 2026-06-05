// Domain types now live in src/lib/sheets.ts (alongside the fetchers).
// Re-exported here for backwards compatibility with existing imports.
export type {
  Choice,
  ChoiceType,
  Question,
  Quiz,
  QuizSummary,
  LeaderboardEntry,
  ScoreSubmission,
} from "./sheets";

// Local alias retained for older call sites.
export type ChoiceType = "text" | "image";

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
