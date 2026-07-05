import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { MakoBar, MakoButton, MakoPanel, ThemeToggle } from "@/components/mako";
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
    } catch { /* ignore */ }
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
    session.reset();
    session.setQuiz(quizQ.data);
    session.setSettings({ participantName, isAnonymous: anonymous, perQuestionFeedback: feedback });
    session.setPrivateGroupCode(groupCode || null);
    const order = shuffle(quizQ.data.questions).map((q) => q.id);
    session.setOrder(order);
    navigate({ to: "/quiz/$quizId/play", params: { quizId } });
  };

  const canStart = !!quizQ.data;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 clip-mako px-3 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
            style={{
              fontFamily: 'var(--font-ui)',
              background: 'var(--mako-panel)',
              boxShadow: 'inset 0 0 0 1px var(--mako-line)',
              color: 'var(--mako-sub)',
            }}
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
          <MakoBar
            channel={quizId}
            guild={quizQ.data?.title ?? '...'}
            className="flex-1"
          />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {loading && (
          <div
            className="h-64 w-full clip-mako animate-pulse"
            style={{ background: 'var(--mako-panel)' }}
          />
        )}

        {!loading && !entry && (
          <MakoPanel className="p-6 text-center">
            <p className="font-semibold" style={{ color: 'var(--mako-wrong)' }}>Quiz not found</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--mako-sub)' }}>
              This quiz id isn't listed in the index.
            </p>
          </MakoPanel>
        )}

        {!loading && entry && quizQ.isError && (
          <MakoPanel className="p-6 text-center">
            <p className="font-semibold" style={{ color: 'var(--mako-wrong)' }}>Couldn't load quiz</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--mako-sub)' }}>
              The quiz JSON file failed to load. Check the URL in the index sheet.
            </p>
          </MakoPanel>
        )}

        {!loading && entry && quizQ.data && (
          <MakoPanel className="flex flex-col gap-6 p-6">
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: 'var(--mako-teal)', textShadow: '0 0 10px var(--mako-glow)' }}
              >
                {quizQ.data.title}
              </h2>
              {quizQ.data.description && (
                <p className="mt-1 text-sm" style={{ color: 'var(--mako-sub)' }}>
                  {quizQ.data.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <StatBox label="QUESTIONS" value={String(quizQ.data.questions.length)} />
              <StatBox label="TIME / Q" value={`${quizQ.data.timeLimitSeconds}s`} />
            </div>

            <Field label="Your name">
              <Input
                id="name"
                placeholder="Leave blank to play as Anonymous"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={anonymous}
                autoFocus
                className="border-[var(--mako-line)] bg-transparent focus-visible:ring-[var(--mako-teal)]"
                style={{ color: 'var(--mako-ink)' }}
              />
            </Field>

            <ToggleRow
              id="anon"
              label="Play anonymously"
              desc='Your score will be saved as "Anonymous".'
              checked={anonymous}
              onCheckedChange={setAnonymous}
            />

            <ToggleRow
              id="fb"
              label="Per-question feedback"
              desc="Show correct/incorrect after each answer."
              checked={feedback}
              onCheckedChange={setFeedback}
            />

            {/* Group code */}
            <div
              className="flex flex-col gap-3 clip-mako p-4"
              style={{ background: 'var(--mako-line-soft)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: 'var(--mako-sub)' }} />
                <span
                  className="text-sm font-medium tracking-widest uppercase"
                  style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-ink)' }}
                >
                  Private Group
                </span>
                <span
                  className="text-[10px] tracking-widest"
                  style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
                >
                  (optional)
                </span>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--mako-sub)' }}>
                Play with friends on a private leaderboard. Generate a code to share, or join one.
              </p>

              {groupCode ? (
                <div
                  className="flex items-center justify-between gap-2 clip-mako px-4 py-3"
                  style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
                >
                  <div>
                    <div
                      className="text-[10px] tracking-widest"
                      style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
                    >
                      {generatedCode ? 'YOUR CODE' : 'JOINING'}
                    </div>
                    <div
                      className="text-xl font-semibold tracking-widest"
                      style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-teal)' }}
                    >
                      {groupCode}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {generatedCode && (
                      <MakoButton variant="secondary" className="py-2 px-3 text-xs" onClick={handleCopy}>
                        {copied ? <><Check className="mr-1 h-3 w-3 inline" />Copied</> : <><Copy className="mr-1 h-3 w-3 inline" />Copy</>}
                      </MakoButton>
                    )}
                    <MakoButton variant="secondary" className="py-2 px-3 text-xs" onClick={handleClearGroup}>
                      Clear
                    </MakoButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <MakoButton variant="secondary" className="py-3 text-sm" onClick={handleGenerate}>
                    Generate group code
                  </MakoButton>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1" style={{ background: 'var(--mako-line)' }} />
                    <span className="text-[10px] tracking-widest" style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}>
                      OR JOIN
                    </span>
                    <div className="h-px flex-1" style={{ background: 'var(--mako-line)' }} />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter 6-char code"
                      value={joinInput}
                      onChange={(e) => { setJoinInput(e.target.value); if (joinError) setJoinError(null); }}
                      maxLength={8}
                      className="font-mono uppercase tracking-widest border-[var(--mako-line)] bg-transparent focus-visible:ring-[var(--mako-teal)]"
                      style={{ color: 'var(--mako-ink)' }}
                    />
                    <MakoButton variant="secondary" className="shrink-0 py-2 px-4 text-sm" onClick={handleJoin}>
                      Join
                    </MakoButton>
                  </div>
                  {joinError && (
                    <p className="text-xs" style={{ color: 'var(--mako-wrong)' }}>{joinError}</p>
                  )}
                </div>
              )}
            </div>

            <MakoButton
              className="py-4 text-base uppercase"
              disabled={!canStart}
              onClick={handleStart}
            >
              Start Quiz
            </MakoButton>
          </MakoPanel>
        )}
      </main>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="clip-mako p-3"
      style={{ background: 'var(--mako-line-soft)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
    >
      <div
        className="text-[10px] tracking-widest"
        style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
      >
        {label}
      </div>
      <div
        className="text-lg font-semibold"
        style={{ fontFamily: 'var(--font-ui)', color: 'var(--mako-amber)' }}
      >
        {value}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        className="text-[11px] tracking-widest uppercase"
        style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  desc,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between clip-mako px-4 py-3"
      style={{ background: 'var(--mako-line-soft)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
    >
      <div>
        <Label
          htmlFor={id}
          className="cursor-pointer text-sm font-medium"
          style={{ color: 'var(--mako-ink)' }}
        >
          {label}
        </Label>
        <p className="text-xs" style={{ color: 'var(--mako-sub)' }}>{desc}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
