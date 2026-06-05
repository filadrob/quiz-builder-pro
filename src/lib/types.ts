export type ChoiceType = "text" | "image";

export interface Choice {
  type: ChoiceType;
  value: string;
}

export interface Question {
  id: string;
  imageUrl: string;
  choices: Choice[];
  correctChoiceIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimitSeconds: number;
  questions: Question[];
}

export interface QuizIndexEntry {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimitSeconds: number;
  jsonUrl: string;
}

export interface LeaderboardEntry {
  participantName: string;
  totalScore: number;
  totalTime: number;
  submittedAt: string;
}

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
