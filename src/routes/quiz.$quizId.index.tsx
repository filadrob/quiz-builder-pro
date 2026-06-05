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
import { useDocumentTitle } from "@/lib/use-document-title";
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
  const [groupCode, setGroupCodeLocal] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loading = indexQ.isLoading || quizQ.isLoading;
  useDocumentTitle(quizQ.data?.title ? `${quizQ.data.title} – Quiz Platform` : "Quiz – Quiz Platform");

  const handleGenerate = () => {
    const code = generateGroupCode();
    setGeneratedCode(code);
    setGroupCodeLocal(code);
    setJoinInput("");
    setJoinError(null);
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handleJoin = () => {
    const normalized = normalizeGroupCode(joinInput);
    if (!isValidGroupCode(normalized)) {
      setJoinError("Enter a valid 6-character code (letters and numbers).");
      return;
    }
    setJoinError(null);
    setGeneratedCode(null);
    setGroupCodeLocal(normalized);
  };

  const handleClearGroup = () => {
    setGroupCodeLocal("");
    setGeneratedCode(null);
    setJoinInput("");
    setJoinError(null);
  };

  const handleStart = () => {
    if (!quizQ.data) return;
    const participantName = anonymous ? "Anonymous" : (name.trim() || "Anonymous");
    session.setQuiz(quizQ.data);
    session.setSettings({
      participantName,
      isAnonymous: anonymous,
      perQuestionFeedback: feedback,
    });
    session.setPrivateGroupCode(groupCode || null);
    const order = shuffle(quizQ.data.questions).map((q) => q.id);
    session.setOrder(order);
    navigate({ to: "/quiz/$quizId/play", params: { quizId } });
  };

  const canStart = !!quizQ.data;

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
                  placeholder="Enter your name (leave blank to play as Anonymous)"
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

              <div className="flex flex-col gap-3 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Private group (optional)</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Play with friends on a private leaderboard. Generate a code to share, or join one.
                </p>

                {groupCode ? (
                  <div className="flex flex-col gap-2 rounded-md bg-secondary p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {generatedCode ? "Your group code" : "Joining group"}
                        </div>
                        <div className="font-mono text-xl font-semibold tracking-widest">
                          {groupCode}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {generatedCode && (
                          <Button size="sm" variant="outline" onClick={handleCopy} aria-label="Copy code">
                            {copied ? (
                              <>
                                <Check className="mr-1 h-4 w-4" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="mr-1 h-4 w-4" /> Copy
                              </>
                            )}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={handleClearGroup}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button type="button" variant="outline" onClick={handleGenerate}>
                      Generate group code
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground">or join</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter 6-char code"
                        value={joinInput}
                        onChange={(e) => {
                          setJoinInput(e.target.value);
                          if (joinError) setJoinError(null);
                        }}
                        maxLength={8}
                        className="font-mono uppercase tracking-widest"
                      />
                      <Button type="button" variant="secondary" onClick={handleJoin}>
                        Join
                      </Button>
                    </div>
                    {joinError && <p className="text-xs text-destructive">{joinError}</p>}
                  </div>
                )}
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
