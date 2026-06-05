import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardTable } from "@/components/quiz/LeaderboardTable";
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

  const quizQ = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => fetchQuiz(quizId),
  });
  useDocumentTitle(quizQ.data?.title ? `Leaderboard – ${quizQ.data.title}` : "Leaderboard – Quiz Platform");

  // Private (group-filtered) leaderboard if group code present
  const privateLB = useQuery({
    queryKey: ["leaderboard", quizId, group ?? null],
    queryFn: () => fetchLeaderboard(quizId, group),
    enabled: !!group,
  });

  // Public leaderboard always shown (and used to compute public rank for group view)
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
    navigate({
      to: "/quiz/$quizId/leaderboard",
      params: { quizId },
      search: { group: normalized },
    });
  };

  const publicRank =
    group && highlight && publicLB.data
      ? findRank(publicLB.data, highlight.name, highlight.score)
      : null;

  const title = quizQ.data?.title ?? "Leaderboard";
  const isModified = quizQ.data?.isModified === true;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/quiz/$quizId" params={{ quizId }}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Quiz
            </Link>
          </Button>
          <div className="min-w-0 text-right">
            <h1 className="truncate font-semibold">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {group ? `Private Group: ${group}` : "Public Leaderboard"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
        {quizQ.isError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <span>Couldn't load quiz details.</span>
          </div>
        )}

        {isModified && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This quiz was modified after some scores were recorded. Results may not be directly comparable.
            </span>
          </div>
        )}

        {group ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-lg font-bold">
                Private group:{" "}
                <span className="font-mono tracking-widest">{group}</span>
              </h2>
            </div>
            {privateLB.isLoading && <Skeleton className="h-32 w-full" />}
            {privateLB.isError && (
              <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <span className="text-destructive">Couldn't load group leaderboard.</span>
                <Button size="sm" variant="outline" onClick={() => privateLB.refetch()}>
                  Retry
                </Button>
              </div>
            )}
            {privateLB.data && (
              <LeaderboardTable entries={privateLB.data} highlight={highlight} />
            )}
            {highlight && publicLB.data && (
              <p className="text-sm text-muted-foreground">
                {publicRank
                  ? `Your rank on the public leaderboard: #${publicRank} of ${publicLB.data.length}`
                  : `Your score isn't on the public leaderboard yet.`}
              </p>
            )}
          </section>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Join a private group
              </CardTitle>
              <CardDescription>
                Enter a group code to see that group's private leaderboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder="6-char code"
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value);
                    if (joinError) setJoinError(null);
                  }}
                  maxLength={8}
                  className="font-mono uppercase tracking-widest"
                />
                <Button onClick={handleJoin}>View group</Button>
              </div>
              {joinError && <p className="text-xs text-destructive">{joinError}</p>}
              {session.privateGroupCode && session.privateGroupCode !== group && (
                <p className="text-xs text-muted-foreground">
                  Your current session code:{" "}
                  <button
                    type="button"
                    className="font-mono underline"
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
            </CardContent>
          </Card>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Public leaderboard</h2>
          <p className="text-sm text-muted-foreground">
            All players, sorted by score (highest first), with total time as tiebreaker.
          </p>
          {publicLB.isLoading && <Skeleton className="h-32 w-full" />}
          {publicLB.isError && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <span className="text-destructive">Couldn't load public leaderboard.</span>
              <Button size="sm" variant="outline" onClick={() => publicLB.refetch()}>
                Retry
              </Button>
            </div>
          )}
          {publicLB.data && (
            <LeaderboardTable
              entries={publicLB.data}
              highlight={!group ? highlight : null}
            />
          )}
        </section>
      </main>
    </div>
  );
}
