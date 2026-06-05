import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchQuizIndex, fetchQuiz } from "@/lib/sheets";
import { shuffle } from "@/lib/shuffle";
import { useQuizSession } from "@/lib/session-context";
import { generateGroupCode, isValidGroupCode, normalizeGroupCode } from "@/lib/group-code";
import { ArrowLeft, Copy, Check, Users } from "lucide-react";

export const Route = createFileRoute("/quiz/$quizId/")({
  component: SetupPage,
});

function SetupPage() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const session = useQuizSession();

  const indexQ = useQuery({ queryKey: ["quiz-index"], queryFn: fetchQuizIndex });
  const entry = indexQ.data?.find((q) => q.id === quizId);

  const quizQ = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => fetchQuiz(quizId),
    enabled: !!entry,
  });

  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [feedback, setFeedback] = useState(true);

  const loading = indexQ.isLoading || quizQ.isLoading;

  const handleStart = () => {
    if (!quizQ.data) return;
    const participantName = anonymous ? "Anonymous" : (name.trim() || "Anonymous");
    session.setQuiz(quizQ.data);
    session.setSettings({
      participantName,
      isAnonymous: anonymous,
      perQuestionFeedback: feedback,
    });
    const order = shuffle(quizQ.data.questions).map((q) => q.id);
    session.setOrder(order);
    navigate({ to: "/quiz/$quizId/play", params: { quizId } });
  };

  const canStart = !!quizQ.data && (anonymous || name.trim().length > 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" /> All quizzes
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {loading && <Skeleton className="h-64 w-full rounded-lg" />}

        {!loading && !entry && (
          <Card>
            <CardHeader>
              <CardTitle>Quiz not found</CardTitle>
              <CardDescription>
                This quiz id isn't listed in the index.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!loading && entry && quizQ.isError && (
          <Card>
            <CardHeader>
              <CardTitle>Couldn't load quiz</CardTitle>
              <CardDescription>
                The quiz JSON file failed to load. Check the URL in the index sheet.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!loading && entry && quizQ.data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{quizQ.data.title}</CardTitle>
              <CardDescription>{quizQ.data.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-secondary p-3">
                  <div className="text-muted-foreground">Questions</div>
                  <div className="text-lg font-semibold">{quizQ.data.questions.length}</div>
                </div>
                <div className="rounded-md bg-secondary p-3">
                  <div className="text-muted-foreground">Time per question</div>
                  <div className="text-lg font-semibold">{quizQ.data.timeLimitSeconds}s</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={anonymous}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="anon" className="cursor-pointer">Play anonymously</Label>
                  <p className="text-xs text-muted-foreground">
                    Your score will be saved as "Anonymous".
                  </p>
                </div>
                <Switch id="anon" checked={anonymous} onCheckedChange={setAnonymous} />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="fb" className="cursor-pointer">Per-question feedback</Label>
                  <p className="text-xs text-muted-foreground">
                    Show correct/incorrect after each answer.
                  </p>
                </div>
                <Switch id="fb" checked={feedback} onCheckedChange={setFeedback} />
              </div>

              <Button size="lg" disabled={!canStart} onClick={handleStart}>
                Start quiz
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
