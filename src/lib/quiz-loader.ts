import type { Quiz } from "./types";

export async function fetchQuiz(jsonUrl: string): Promise<Quiz> {
  const res = await fetch(jsonUrl);
  if (!res.ok) throw new Error(`Failed to load quiz: ${res.status}`);
  const quiz = (await res.json()) as Quiz;
  if (!quiz.questions?.length) throw new Error("Quiz has no questions");
  return quiz;
}
