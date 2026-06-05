import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResultsBreakdown } from "@/components/quiz/ResultsBreakdown";
import { LeaderboardTable } from "@/components/quiz/LeaderboardTable";
import { fetchLeaderboard, submitScore } from "@/lib/sheets";
import { useQuizSession } from "@/lib/session-context";
import { Home, RotateCcw, Trophy } from "lucide-react";

export const Route = createFileRoute("/quiz/$quizId/results")({
  component: ResultsPage,
});

function ResultsPage() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const session = useQuizSession();

  useEffect(() => {
    if (!session.quiz || !session.settings || session.answers.length === 0) {
      navigate({ to: "/quiz/$quizId", params: { quizId } });
    }
  }, [session.quiz, session.settings, session.answers.length, navigate, quizId]);

  const lbQuery = useQuery({
    queryKey: ["leaderboard", quizId],
    queryFn: () => fetchLeaderboard(quizId),
  });

  const [name, setName] = useState(session.settings?.participantName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!session.quiz || !session.settings || session.answers.length === 0) return null;

  const totalScore = session.answers.reduce((s, a) => s + a.points, 0);
  const totalTime = session.answers.reduce((s, a) => s + a.responseTime, 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const isAnonymous = session.settings?.isAnonymous ?? false;
      await submitScore({
        quizId,
        name: isAnonymous ? "Anonymous" : (name.trim() || "Anonymous"),
        isAnonymous,
        score: totalScore,
        totalTime: Number(totalTime.toFixed(2)),
        privateGroupCode: session.privateGroupCode ?? undefined,
      });
      setSubmitted(true);
      // Refetch immediately; don't gate the UI on its result.
      lbQuery.refetch().catch(() => {
        /* leaderboard refresh is best-effort */
      });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <h1 className="truncate font-semibold">{session.quiz.title} — Results</h1>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/quiz/$quizId" params={{ quizId }}>
                <RotateCcw className="mr-1 h-4 w-4" /> Retake
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/">
                <Home className="mr-1 h-4 w-4" /> Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
        <ResultsBreakdown quiz={session.quiz} answers={session.answers} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Submit to leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {submitted ? (
              <p className="text-sm text-emerald-600">
                Score submitted! See the leaderboard below.
              </p>
            ) : (
              <>
                <Label htmlFor="lbname">Display name</Label>
                <Input
                  id="lbname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous"
                />
                {submitError && (
                  <p className="text-sm text-destructive">{submitError}</p>
                )}
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit my score"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Leaderboard</h2>
            {session.privateGroupCode && (
              <Button asChild size="sm" variant="outline">
                <Link
                  to="/quiz/$quizId/leaderboard"
                  params={{ quizId }}
                  search={{ group: session.privateGroupCode }}
                >
                  View group leaderboard ({session.privateGroupCode})
                </Link>
              </Button>
            )}
          </div>
          {lbQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {lbQuery.isError && (
            <p className="text-sm text-destructive">Couldn't load leaderboard.</p>
          )}
          {lbQuery.data && <LeaderboardTable entries={lbQuery.data} />}
        </section>
      </main>
    </div>
  );
}
