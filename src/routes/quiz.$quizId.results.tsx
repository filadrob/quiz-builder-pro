import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResultsBreakdown } from "@/components/quiz/ResultsBreakdown";
import { ShareResultSection } from "@/components/quiz/ShareResultSection";
import { MakoBar, MakoButton, MakoPanel, ThemeToggle } from "@/components/mako";
import { submitScore } from "@/lib/sheets";
import { useQuizSession } from "@/lib/session-context";
import { useDocumentTitle } from "@/lib/use-document-title";
import { Home, RotateCcw, Trophy } from "lucide-react";

export const Route = createFileRoute("/quiz/$quizId/results")({
  component: ResultsPage,
});

function ResultsPage() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const session = useQuizSession();
  useDocumentTitle(session.quiz?.title ? `Your Results – ${session.quiz.title}` : "Your Results – Quiz Platform");

  useEffect(() => {
    if (!session.quiz || !session.settings || session.answers.length === 0) {
      navigate({ to: "/quiz/$quizId", params: { quizId } });
    }
  }, [session.quiz, session.settings, session.answers.length, navigate, quizId]);

  const [name, setName] = useState(session.settings?.participantName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!session.quiz || !session.settings || session.answers.length === 0) return null;

  const totalScore = session.answers.reduce((s, a) => s + a.points, 0);
  const totalTime = session.answers.reduce((s, a) => s + a.responseTime, 0);
  const groupCode = session.privateGroupCode ?? undefined;
  const testMode = session.testMode;
  const canSubmit = !testMode || session.allowSubmit;

  const goToLeaderboard = (opts?: { submittedName?: string; includeGroup?: boolean }) => {
    const includeGroup = opts?.includeGroup ?? true;
    const submittedName = opts?.submittedName;
    navigate({
      to: "/quiz/$quizId/leaderboard",
      params: { quizId },
      search: includeGroup && groupCode ? { group: groupCode } : {},
      state: ((prev: Record<string, unknown>) => ({
        ...prev,
        ...(submittedName ? { submittedName, submittedScore: totalScore } : {}),
      })) as never,
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const isAnonymous = session.settings?.isAnonymous ?? false;
      const finalName = isAnonymous ? "Anonymous" : (name.trim() || "Anonymous");
      await submitScore({
        quizId,
        name: finalName,
        isAnonymous,
        score: totalScore,
        totalTime: Number(totalTime.toFixed(2)),
        privateGroupCode: groupCode,
      });
      setSubmitted(true);
      if (!testMode) goToLeaderboard({ submittedName: finalName });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <MakoBar channel="results" guild={session.quiz.title} className="flex-1" />
          <div className="flex items-center gap-2">
            {testMode ? (
              <Link
                to="/admin"
                className="clip-mako px-3 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
                style={{
                  fontFamily: 'var(--font-ui)',
                  background: 'var(--mako-panel)',
                  boxShadow: 'inset 0 0 0 1px var(--mako-line)',
                  color: 'var(--mako-sub)',
                }}
              >
                <RotateCcw className="mr-1 inline h-3 w-3" />Back to builder
              </Link>
            ) : (
              <Link
                to="/quiz/$quizId"
                params={{ quizId }}
                className="clip-mako px-3 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
                style={{
                  fontFamily: 'var(--font-ui)',
                  background: 'var(--mako-panel)',
                  boxShadow: 'inset 0 0 0 1px var(--mako-line)',
                  color: 'var(--mako-sub)',
                }}
              >
                <RotateCcw className="mr-1 inline h-3 w-3" />Retake
              </Link>
            )}
            <Link
              to="/"
              className="clip-mako px-3 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-ui)',
                background: 'var(--mako-panel)',
                boxShadow: 'inset 0 0 0 1px var(--mako-line)',
                color: 'var(--mako-sub)',
              }}
            >
              <Home className="mr-1 inline h-3 w-3" />Home
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <ResultsBreakdown quiz={session.quiz} answers={session.answers} />

        <ShareResultSection
          quiz={session.quiz}
          answers={session.answers}
          totalScore={totalScore}
          totalTime={totalTime}
        />

        <MakoPanel className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" style={{ color: 'var(--mako-amber)' }} />
            <span
              className="text-sm font-bold tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-ui)', color: 'var(--mako-ink)' }}
            >
              Submit to leaderboard
            </span>
          </div>

          {submitted ? (
            <p className="text-sm tracking-widest" style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-correct)' }}>
              SCORE SUBMITTED ✓
            </p>
          ) : skipped ? (
            <p className="text-sm" style={{ color: 'var(--mako-sub)' }}>Score not submitted.</p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="lbname"
                  className="text-[11px] tracking-widest uppercase"
                  style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
                >
                  Display name
                </Label>
                <Input
                  id="lbname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous"
                  className="border-[var(--mako-line)] bg-transparent focus-visible:ring-[var(--mako-teal)]"
                  style={{ color: 'var(--mako-ink)' }}
                />
              </div>

              {groupCode && (
                <p className="text-xs" style={{ color: 'var(--mako-sub)' }}>
                  Your score will appear on both your private group leaderboard and the public leaderboard.
                </p>
              )}
              {submitError && (
                <p className="text-sm" style={{ color: 'var(--mako-wrong)' }}>{submitError}</p>
              )}

              <div className="flex gap-3">
                <MakoButton
                  className="flex-1 py-3 text-sm uppercase"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit my score"}
                </MakoButton>
                <MakoButton
                  variant="secondary"
                  className="py-3 px-5 text-sm uppercase"
                  disabled={submitting}
                  onClick={() => setSkipped(true)}
                >
                  Skip
                </MakoButton>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {groupCode && (
              <MakoButton
                variant="secondary"
                className="py-2 px-4 text-xs uppercase"
                onClick={() => goToLeaderboard({ includeGroup: true })}
              >
                Group leaderboard ({groupCode})
              </MakoButton>
            )}
            <MakoButton
              variant="secondary"
              className="py-2 px-4 text-xs uppercase"
              onClick={() => goToLeaderboard({ includeGroup: false })}
            >
              Public leaderboard
            </MakoButton>
          </div>
        </MakoPanel>
      </main>
    </div>
  );
}
