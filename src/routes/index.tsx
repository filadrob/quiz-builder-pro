import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QuizCard } from "@/components/quiz/QuizCard";
import { MakoBar, ThemeToggle } from "@/components/mako";
import { fetchQuizIndex } from "@/lib/sheets";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quiz Platform" },
      { name: "description", content: "Image-based multiple-choice quizzes. Pick a quiz and play." },
      { property: "og:title", content: "Quiz Platform" },
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
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <MakoBar channel="quiz-platform" guild="FLASHCARD HQ" className="flex-1" />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8">
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--mako-teal)', textShadow: '0 0 12px var(--mako-glow)' }}
          >
            SELECT QUIZ
          </h2>
          <p
            className="mt-1 text-[11px] tracking-widest"
            style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
          >
            IMAGE QUESTIONS · TICKING CLOCK · LEADERBOARD
          </p>
        </section>

        {q.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-48 w-full clip-mako animate-pulse"
                style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
              />
            ))}
          </div>
        )}

        {q.isError && (
          <div
            className="flex flex-col items-center gap-3 clip-mako p-8 text-center"
            style={{
              background: 'var(--mako-panel)',
              boxShadow: 'inset 0 0 0 1px var(--mako-wrong)',
            }}
          >
            <AlertCircle className="h-10 w-10" style={{ color: 'var(--mako-wrong)' }} />
            <p className="font-medium" style={{ color: 'var(--mako-ink)' }}>
              Couldn't load the quiz list.
            </p>
            <p className="text-sm" style={{ color: 'var(--mako-sub)' }}>
              Check that the Sheets API key and quiz index sheet ID are configured.
            </p>
            <button
              className="clip-mako mt-1 px-4 py-2 text-sm tracking-widest uppercase transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-ui)',
                background: 'var(--mako-panel)',
                boxShadow: 'inset 0 0 0 1px var(--mako-line)',
                color: 'var(--mako-ink)',
              }}
              onClick={() => q.refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {q.isSuccess && q.data.length === 0 && (
          <div
            className="clip-mako p-12 text-center"
            style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--mako-ink)' }}>
              No quizzes yet
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--mako-sub)' }}>
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

        <div className="mt-12 text-center">
          <Link
            to="/"
            className="text-[11px] tracking-widest transition-colors hover:text-[var(--mako-teal)]"
            style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
          >
            HOME
          </Link>
        </div>
      </main>
    </div>
  );
}
