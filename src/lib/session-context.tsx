import { createContext, useContext, useState, type ReactNode } from "react";
import type { AnswerRecord, Quiz } from "./types";

export interface SessionSettings {
  participantName: string;
  anonymous: boolean;
  perQuestionFeedback: boolean;
}

interface SessionState {
  quiz: Quiz | null;
  settings: SessionSettings | null;
  orderedQuestionIds: string[];
  answers: AnswerRecord[];
  setQuiz: (q: Quiz) => void;
  setSettings: (s: SessionSettings) => void;
  setOrder: (ids: string[]) => void;
  recordAnswer: (a: AnswerRecord) => void;
  reset: () => void;
}

const QuizSessionContext = createContext<SessionState | null>(null);

export function QuizSessionProvider({ children }: { children: ReactNode }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [orderedQuestionIds, setOrder] = useState<string[]>([]);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const recordAnswer = (a: AnswerRecord) => setAnswers((prev) => [...prev, a]);
  const reset = () => {
    setQuiz(null);
    setSettings(null);
    setOrder([]);
    setAnswers([]);
  };

  return (
    <QuizSessionContext.Provider
      value={{
        quiz,
        settings,
        orderedQuestionIds,
        answers,
        setQuiz,
        setSettings,
        setOrder,
        recordAnswer,
        reset,
      }}
    >
      {children}
    </QuizSessionContext.Provider>
  );
}

export function useQuizSession() {
  const ctx = useContext(QuizSessionContext);
  if (!ctx) throw new Error("useQuizSession must be used within QuizSessionProvider");
  return ctx;
}
