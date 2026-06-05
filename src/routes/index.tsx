import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuizCard } from "@/components/quiz/QuizCard";
import { fetchQuizIndex } from "@/lib/sheets";
import { AlertCircle, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flashcard Quizzes" },
      { name: "description", content: "Image-based multiple-choice quizzes. Pick a quiz and play." },
      { property: "og:title", content: "Flashcard Quizzes" },
      { property: "og:description", content: "Image-based multiple-choice quizzes." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const q = useQuery({
    queryKey: ["quiz-index"],
    queryFn: fetchQuizIndex,
    retry: 1,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Flashcard Quizzes</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold">Pick a quiz</h2>
          <p className="text-sm text-muted-foreground">
            Image-based questions, a ticking clock, and a leaderboard.
          </p>
        </section>

        {q.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        )}

        {q.isError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="font-medium">Couldn't load the quiz list.</p>
            <p className="text-sm text-muted-foreground">
              Check that the Sheets API key and quiz index sheet ID are configured.
            </p>
            <Button variant="outline" onClick={() => q.refetch()}>Retry</Button>
          </div>
        )}

        {q.isSuccess && q.data.length === 0 && (
          <div className="rounded-lg border bg-card p-12 text-center">
            <h3 className="text-lg font-semibold">No quizzes yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add a row to the Quiz Index sheet to publish your first quiz.
            </p>
          </div>
        )}

        {q.isSuccess && q.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {q.data.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">Home</Link>
        </div>
      </main>
    </div>
  );
}
