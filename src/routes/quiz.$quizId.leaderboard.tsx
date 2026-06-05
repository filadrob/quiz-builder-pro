import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LeaderboardTable } from "@/components/quiz/LeaderboardTable";
import { fetchLeaderboard, fetchQuizIndex } from "@/lib/sheets";
import { useQuizSession } from "@/lib/session-context";
import { isValidGroupCode, normalizeGroupCode } from "@/lib/group-code";
import { ArrowLeft, Users } from "lucide-react";
import { useState } from "react";

type Search = { group?: string };

export const Route = createFileRoute("/quiz/$quizId/leaderboard")({
  validateSearch: (raw: Record<string, unknown>): Search => {
    const g = typeof raw.group === "string" ? normalizeGroupCode(raw.group) : "";
    return g && isValidGroupCode(g) ? { group: g } : {};
  },
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { quizId } = Route.useParams();
  const { group } = Route.useSearch();
  const navigate = useNavigate();
  const session = useQuizSession();

  const indexQ = useQuery({ queryKey: ["quiz-index"], queryFn: fetchQuizIndex });
  const quizMeta = indexQ.data?.find((q) => q.id === quizId);

  // Private (group-filtered) leaderboard if group code present
  const privateLB = useQuery({
    queryKey: ["leaderboard", quizId, group ?? null],
    queryFn: () => fetchLeaderboard(quizId, group),
    enabled: !!group,
  });

  // Public leaderboard always shown below (so participant can see their rank)
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/quiz/$quizId" params={{ quizId }}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Quiz
            </Link>
          </Button>
          <h1 className="truncate font-semibold">
            {quizMeta?.title ?? "Leaderboard"}
            {quizMeta?.isModified && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Modified
              </span>
            )}
          </h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
        {group ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-lg font-bold">
                Private group:{" "}
                <span className="font-mono tracking-widest">{group}</span>
              </h2>
            </div>
            {privateLB.isLoading && (
              <p className="text-sm text-muted-foreground">Loading group scores…</p>
            )}
            {privateLB.isError && (
              <p className="text-sm text-destructive">Couldn't load group leaderboard.</p>
            )}
            {privateLB.data && <LeaderboardTable entries={privateLB.data} />}
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
          {publicLB.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {publicLB.isError && (
            <p className="text-sm text-destructive">Couldn't load public leaderboard.</p>
          )}
          {publicLB.data && <LeaderboardTable entries={publicLB.data} />}
        </section>
      </main>
    </div>
  );
}
