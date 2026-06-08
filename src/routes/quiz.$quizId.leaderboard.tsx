import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardTable } from "@/components/quiz/LeaderboardTable";
import { MakoBar, MakoButton, MakoPanel, ThemeToggle } from "@/components/mako";
import { fetchLeaderboard, fetchQuiz, type LeaderboardEntry } from "@/lib/sheets";
import { useQuizSession } from "@/lib/session-context";
import { isValidGroupCode, normalizeGroupCode } from "@/lib/group-code";
import { useDocumentTitle } from "@/lib/use-document-title";
import { AlertCircle, AlertTriangle, ArrowLeft, Users } from "lucide-react";
import { useState } from "react";

type Search = { group?: string };
type LocationState = { submittedName?: string; submittedScore?: number };

export const Route = createFileRoute("/quiz/$quizId/leaderboard")({
  validateSearch: (raw: Record<string, unknown>): Search => {
    const g = typeof raw.group === "string" ? normalizeGroupCode(raw.group) : "";
    return g && isValidGroupCode(g) ? { group: g } : {};
  },
  component: LeaderboardPage,
});

function findRank(entries: LeaderboardEntry[], name: string, score: number): number | null {
  const target = name || "Anonymous";
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const display = e.isAnonymous ? "Anonymous" : e.name || "Anonymous";
    if (display === target && e.score === score) return i + 1;
  }
  return null;
}

function LeaderboardPage() {
  const { quizId } = Route.useParams();
  const { group } = Route.useSearch();
  const navigate = useNavigate();
  const session = useQuizSession();
  const locationState = useRouterState({
    select: (s) => (s.location.state ?? {}) as LocationState,
  });
  const highlight =
    locationState.submittedName !== undefined && locationState.submittedScore !== undefined
      ? { name: locationState.submittedName, score: locationState.submittedScore }
      : null;

  const quizQ = useQuery({ queryKey: ["quiz", quizId], queryFn: () => fetchQuiz(quizId) });
  useDocumentTitle(quizQ.data?.title ? `Leaderboard – ${quizQ.data.title}` : "Leaderboard – Quiz Platform");

  const privateLB = useQuery({
    queryKey: ["leaderboard", quizId, group ?? null],
    queryFn: () => fetchLeaderboard(quizId, group),
    enabled: !!group,
  });

  const publicLB = useQuery({
    queryKey: ["leaderboard", quizId],
    queryFn: () => fetchLeaderboard(quizId),
  });

  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoin = () => {
    const normalized = normalizeGroupCode(joinInput);
    if (!isValidGroupCode(normalized)) {
      setJoinError("Enter a valid 6-character code.");
      return;
    }
    setJoinError(null);
    navigate({ to: "/quiz/$quizId/leaderboard", params: { quizId }, search: { group: normalized } });
  };

  const publicRank =
    group && highlight && publicLB.data
      ? findRank(publicLB.data, highlight.name, highlight.score)
      : null;

  const title = quizQ.data?.title ?? "Leaderboard";
  const isModified = quizQ.data?.isModified === true;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            to="/quiz/$quizId"
            params={{ quizId }}
            className="flex items-center gap-1 clip-mako px-3 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
            style={{
              fontFamily: 'var(--font-ui)',
              background: 'var(--mako-panel)',
              boxShadow: 'inset 0 0 0 1px var(--mako-line)',
              color: 'var(--mako-sub)',
            }}
          >
            <ArrowLeft className="h-3 w-3" /> Quiz
          </Link>
          <MakoBar
            channel="leaderboard"
            guild={title}
            className="flex-1"
          />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
        {quizQ.isError && (
          <div
            className="flex items-start gap-2 clip-mako p-3 text-sm"
            style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-wrong)' }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--mako-wrong)' }} />
            <span style={{ color: 'var(--mako-wrong)' }}>Couldn't load quiz details.</span>
          </div>
        )}

        {isModified && (
          <div
            className="flex items-start gap-2 clip-mako p-3 text-sm"
            style={{ background: 'rgba(255,180,84,.06)', boxShadow: 'inset 0 0 0 1px var(--mako-amber)' }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--mako-amber)' }} />
            <span style={{ color: 'var(--mako-amber)' }}>
              This quiz was modified after some scores were recorded. Results may not be directly comparable.
            </span>
          </div>
        )}

        {group ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: 'var(--mako-teal)' }} />
              <h2
                className="text-lg font-bold tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-ui)', color: 'var(--mako-ink)' }}
              >
                Group:{' '}
                <span style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-teal)' }}>
                  {group}
                </span>
              </h2>
            </div>
            {privateLB.isLoading && (
              <div className="h-32 w-full clip-mako animate-pulse" style={{ background: 'var(--mako-panel)' }} />
            )}
            {privateLB.isError && (
              <div
                className="flex items-center justify-between clip-mako p-3 text-sm"
                style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-wrong)' }}
              >
                <span style={{ color: 'var(--mako-wrong)' }}>Couldn't load group leaderboard.</span>
                <MakoButton variant="secondary" className="py-1 px-3 text-xs" onClick={() => privateLB.refetch()}>
                  Retry
                </MakoButton>
              </div>
            )}
            {privateLB.data && (
              <LeaderboardTable entries={privateLB.data} highlight={highlight} />
            )}
            {highlight && publicLB.data && (
              <p
                className="text-xs tracking-widest"
                style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
              >
                {publicRank
                  ? `PUBLIC RANK: #${publicRank} OF ${publicLB.data.length}`
                  : `YOUR SCORE ISN'T ON THE PUBLIC LEADERBOARD YET.`}
              </p>
            )}
          </section>
        ) : (
          <MakoPanel className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: 'var(--mako-teal)' }} />
              <span
                className="text-sm font-bold tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-ui)', color: 'var(--mako-ink)' }}
              >
                Join a private group
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--mako-sub)' }}>
              Enter a group code to see that group's private leaderboard.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="6-char code"
                value={joinInput}
                onChange={(e) => { setJoinInput(e.target.value); if (joinError) setJoinError(null); }}
                maxLength={8}
                className="font-mono uppercase tracking-widest border-[var(--mako-line)] bg-transparent focus-visible:ring-[var(--mako-teal)]"
                style={{ color: 'var(--mako-ink)' }}
              />
              <MakoButton variant="secondary" className="shrink-0 py-2 px-4 text-sm uppercase" onClick={handleJoin}>
                View group
              </MakoButton>
            </div>
            {joinError && <p className="text-xs" style={{ color: 'var(--mako-wrong)' }}>{joinError}</p>}
            {session.privateGroupCode && session.privateGroupCode !== group && (
              <p className="text-xs" style={{ color: 'var(--mako-sub)' }}>
                Your session code:{' '}
                <button
                  type="button"
                  className="underline transition-colors hover:text-[var(--mako-teal)]"
                  style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
                  onClick={() =>
                    navigate({
                      to: "/quiz/$quizId/leaderboard",
                      params: { quizId },
                      search: { group: session.privateGroupCode ?? undefined },
                    })
                  }
                >
                  {session.privateGroupCode}
                </button>
              </p>
            )}
          </MakoPanel>
        )}

        <section className="flex flex-col gap-3">
          <h2
            className="text-lg font-bold tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-ui)', color: 'var(--mako-ink)' }}
          >
            Public leaderboard
          </h2>
          <p className="text-xs" style={{ color: 'var(--mako-sub)' }}>
            All players, sorted by score (highest first), total time as tiebreaker.
          </p>
          {publicLB.isLoading && (
            <div className="h-32 w-full clip-mako animate-pulse" style={{ background: 'var(--mako-panel)' }} />
          )}
          {publicLB.isError && (
            <div
              className="flex items-center justify-between clip-mako p-3 text-sm"
              style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-wrong)' }}
            >
              <span style={{ color: 'var(--mako-wrong)' }}>Couldn't load public leaderboard.</span>
              <MakoButton variant="secondary" className="py-1 px-3 text-xs" onClick={() => publicLB.refetch()}>
                Retry
              </MakoButton>
            </div>
          )}
          {publicLB.data && (
            <LeaderboardTable entries={publicLB.data} highlight={!group ? highlight : null} />
          )}
        </section>
      </main>
    </div>
  );
}
