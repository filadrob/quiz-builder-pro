// ─────────────────────────────────────────────────────────────────────────────
// Admin persistence seam.
//
// This module is the ONLY place the admin quiz builder talks to storage.
// Tonight it just round-trips through downloaded/uploaded JSON files so
// nothing depends on a backend. When we wire up Supabase (or any other
// backend) later, swap the two functions below to call it — the editor
// UI does not need to change.
// ─────────────────────────────────────────────────────────────────────────────

import type { Quiz } from "@/lib/types";

export function exportQuiz(quiz: Quiz): void {
  const json = JSON.stringify(quiz, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const slug =
    (quiz.id || quiz.title || "quiz")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "quiz";
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importQuiz(file: File): Promise<Quiz> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON.");
  }
  if (!isQuizLike(parsed)) {
    throw new Error("JSON does not look like a Quiz (missing id/title/questions).");
  }
  return parsed;
}

function isQuizLike(v: unknown): v is Quiz {
  if (!v || typeof v !== "object") return false;
  const q = v as Record<string, unknown>;
  return (
    typeof q.id === "string" &&
    typeof q.title === "string" &&
    typeof q.description === "string" &&
    typeof q.timeLimitSeconds === "number" &&
    Array.isArray(q.questions)
  );
}
