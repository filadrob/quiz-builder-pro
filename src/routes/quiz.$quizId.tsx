import { createFileRoute, Outlet } from "@tanstack/react-router";
import { QuizSessionProvider } from "@/lib/session-context";

export const Route = createFileRoute("/quiz/$quizId")({
  component: QuizLayout,
});

function QuizLayout() {
  return (
    <QuizSessionProvider>
      <Outlet />
    </QuizSessionProvider>
  );
}
