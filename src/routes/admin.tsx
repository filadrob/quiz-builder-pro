import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MakoBar, MakoButton, MakoPanel, ThemeToggle } from "@/components/mako";
import { Home, Plus, Trash2, ArrowUp, ArrowDown, Upload, Download, Image as ImageIcon, AlertTriangle, Play } from "lucide-react";
import { exportQuiz, importQuiz } from "@/lib/admin-persistence";
import { useQuizSession } from "@/lib/session-context";
import { shuffle } from "@/lib/shuffle";
import { makeShapesQuiz, makeFfxivQuiz } from "@/lib/sample-quizzes";
import type { Choice, Question, Quiz } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Quiz Builder" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

// Local editor shape — Quiz + a status flag that mirrors QuizSummary.status.
// Kept as a superset so we can round-trip through JSON without losing it.
type QuizStatus = "draft" | "published" | "archived";
type EditorQuiz = Quiz & { status: QuizStatus };

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function makeChoice(type: Choice["type"] = "text"): Choice {
  return { type, value: "" };
}

function makeQuestion(): Question {
  return {
    id: uid(),
    imageUrl: "",
    textFallback: "",
    choices: [makeChoice(), makeChoice()],
    correctChoiceIndex: 0,
  };
}

function makeQuiz(): EditorQuiz {
  return {
    id: uid(),
    title: "",
    description: "",
    timeLimitSeconds: 30,
    status: "draft",
    questions: [makeQuestion()],
  };
}

function validate(quiz: EditorQuiz): string[] {
  const errs: string[] = [];
  if (!quiz.title.trim()) errs.push("Quiz title is required.");
  if (quiz.timeLimitSeconds <= 0) errs.push("Time limit must be greater than 0.");
  if (quiz.questions.length < 2) errs.push("Quiz needs at least 2 questions.");
  quiz.questions.forEach((q, i) => {
    const n = i + 1;
    if (!q.imageUrl.trim()) errs.push(`Question ${n}: image URL is required.`);
    if (q.choices.length < 2 || q.choices.length > 8)
      errs.push(`Question ${n}: must have between 2 and 8 choices.`);
    if (q.choices.some((c) => !c.value.trim()))
      errs.push(`Question ${n}: every choice needs a value.`);
    if (
      q.correctChoiceIndex < 0 ||
      q.correctChoiceIndex >= q.choices.length
    )
      errs.push(`Question ${n}: mark a correct answer.`);
  });
  return errs;
}

function AdminPage() {
  const [quiz, setQuiz] = useState<EditorQuiz>(() => makeQuiz());
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitToLeaderboard, setSubmitToLeaderboard] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const session = useQuizSession();
  const navigate = useNavigate();

  const validationErrors = useMemo(() => validate(quiz), [quiz]);

  const patchQuiz = (patch: Partial<EditorQuiz>) =>
    setQuiz((q) => ({ ...q, ...patch }));

  const patchQuestion = (idx: number, patch: Partial<Question>) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((qq, i) => (i === idx ? { ...qq, ...patch } : qq)),
    }));

  const addQuestion = () =>
    setQuiz((q) => ({ ...q, questions: [...q.questions, makeQuestion()] }));

  const removeQuestion = (idx: number) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.length > 1 ? q.questions.filter((_, i) => i !== idx) : q.questions,
    }));

  const moveQuestion = (idx: number, dir: -1 | 1) =>
    setQuiz((q) => {
      const j = idx + dir;
      if (j < 0 || j >= q.questions.length) return q;
      const next = q.questions.slice();
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...q, questions: next };
    });

  const addChoice = (qIdx: number) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((qq, i) => {
        if (i !== qIdx) return qq;
        if (qq.choices.length >= 8) return qq;
        return { ...qq, choices: [...qq.choices, makeChoice()] };
      }),
    }));

  const removeChoice = (qIdx: number, cIdx: number) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((qq, i) => {
        if (i !== qIdx) return qq;
        if (qq.choices.length <= 2) return qq;
        const nextChoices = qq.choices.filter((_, k) => k !== cIdx);
        let correct = qq.correctChoiceIndex;
        if (cIdx === correct) correct = 0;
        else if (cIdx < correct) correct -= 1;
        return { ...qq, choices: nextChoices, correctChoiceIndex: correct };
      }),
    }));

  const patchChoice = (qIdx: number, cIdx: number, patch: Partial<Choice>) =>
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((qq, i) =>
        i !== qIdx
          ? qq
          : {
              ...qq,
              choices: qq.choices.map((cc, k) => (k === cIdx ? { ...cc, ...patch } : cc)),
            }
      ),
    }));

  const handleExport = () => {
    setNotice(null);
    const errs = validate(quiz);
    setErrors(errs);
    if (errs.length) return;
    exportQuiz(quiz);
    setNotice("Quiz exported.");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (file: File | null) => {
    if (!file) return;
    setNotice(null);
    setErrors([]);
    try {
      const loaded = await importQuiz(file);
      const status: QuizStatus =
        ((loaded as EditorQuiz).status as QuizStatus) ?? "draft";
      setQuiz({ ...loaded, status });
      setNotice(`Loaded "${loaded.title || loaded.id}".`);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Import failed."]);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLoadSample = (key: string) => {
    let factory: null | (() => EditorQuiz) = null;
    if (key === "shapes") factory = makeShapesQuiz;
    else if (key === "ffxiv") factory = makeFfxivQuiz;
    if (!factory) return;
    const loaded = factory();
    setQuiz(loaded);
    setErrors([]);
    setNotice(`Loaded "${loaded.title}".`);
  };

  const handleTestPlay = () => {
    setNotice(null);
    const errs = validate(quiz);
    setErrors(errs);
    if (errs.length) return;
    // strip editor-only status flag; keep everything else
    const { status: _status, ...rest } = quiz;
    void _status;
    const copy: Quiz = { ...rest, questions: quiz.questions.map((q) => ({ ...q, choices: q.choices.map((c) => ({ ...c })) })) };
    session.reset();
    session.setQuiz(copy);
    session.setSettings({ participantName: "Test Player", isAnonymous: false, perQuestionFeedback: true });
    session.setPrivateGroupCode(null);
    session.setTestMode(true);
    session.setAllowSubmit(submitToLeaderboard);
    session.setOrder(shuffle(copy.questions).map((q) => q.id));
    navigate({ to: "/quiz/$quizId/play", params: { quizId: copy.id } });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <MakoBar channel="admin" guild="QUIZ BUILDER" className="flex-1" />
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="clip-mako px-3 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
              style={{
                fontFamily: "var(--font-ui)",
                background: "var(--mako-panel)",
                boxShadow: "inset 0 0 0 1px var(--mako-line)",
                color: "var(--mako-sub)",
              }}
            >
              <Home className="mr-1 inline h-3 w-3" />
              Home
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        {/* Toolbar */}
        <MakoPanel className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div
            className="text-sm font-bold tracking-widest uppercase"
            style={{ fontFamily: "var(--font-ui)", color: "var(--mako-ink)" }}
          >
            Editing quiz
          </div>
          <div className="flex flex-wrap gap-2">
            <MakoButton
              variant="secondary"
              className="py-2 px-4 text-xs uppercase"
              onClick={() => setQuiz(makeQuiz())}
              type="button"
            >
              New
            </MakoButton>
            <MakoButton
              variant="secondary"
              className="py-2 px-4 text-xs uppercase"
              onClick={handleImportClick}
              type="button"
            >
              <Upload className="mr-1 inline h-3 w-3" /> Import JSON
            </MakoButton>
            <MakoButton
              className="py-2 px-4 text-xs uppercase"
              onClick={handleExport}
              type="button"
            >
              <Download className="mr-1 inline h-3 w-3" /> Export JSON
            </MakoButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </MakoPanel>

        {(errors.length > 0 || notice) && (
          <MakoPanel className="p-4">
            {errors.length > 0 && (
              <div className="flex flex-col gap-1">
                <div
                  className="flex items-center gap-2 text-xs tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-mono-mako)", color: "var(--mako-wrong)" }}
                >
                  <AlertTriangle className="h-4 w-4" /> Fix before export
                </div>
                <ul className="ml-6 list-disc text-sm" style={{ color: "var(--mako-ink)" }}>
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {notice && (
              <p
                className="text-xs tracking-widest uppercase"
                style={{ fontFamily: "var(--font-mono-mako)", color: "var(--mako-correct)" }}
              >
                ▸ {notice}
              </p>
            )}
          </MakoPanel>
        )}

        {/* Quiz-level fields */}
        <MakoPanel className="flex flex-col gap-4 p-6">
          <SectionHeading>Quiz details</SectionHeading>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Quiz ID">
              <Input
                value={quiz.id}
                onChange={(e) => patchQuiz({ id: e.target.value })}
                className="border-[var(--mako-line)] bg-transparent"
                style={{ color: "var(--mako-ink)" }}
              />
            </Field>
            <Field label="Status">
              <select
                value={quiz.status}
                onChange={(e) => patchQuiz({ status: e.target.value as QuizStatus })}
                className="clip-mako w-full px-3 py-2 text-sm"
                style={{
                  fontFamily: "var(--font-ui)",
                  background: "var(--mako-panel)",
                  boxShadow: "inset 0 0 0 1px var(--mako-line)",
                  color: "var(--mako-ink)",
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Title" className="md:col-span-2">
              <Input
                value={quiz.title}
                onChange={(e) => patchQuiz({ title: e.target.value })}
                placeholder="Untitled duty"
                className="border-[var(--mako-line)] bg-transparent"
                style={{ color: "var(--mako-ink)" }}
              />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <Textarea
                value={quiz.description}
                onChange={(e) => patchQuiz({ description: e.target.value })}
                rows={3}
                className="border-[var(--mako-line)] bg-transparent"
                style={{ color: "var(--mako-ink)" }}
              />
            </Field>
            <Field label="Time limit (seconds per question)">
              <Input
                type="number"
                min={1}
                value={quiz.timeLimitSeconds}
                onChange={(e) =>
                  patchQuiz({ timeLimitSeconds: Math.max(0, Number(e.target.value) || 0) })
                }
                className="border-[var(--mako-line)] bg-transparent"
                style={{ color: "var(--mako-ink)" }}
              />
            </Field>
          </div>
        </MakoPanel>

        {/* Questions */}
        <div className="flex flex-col gap-6">
          {quiz.questions.map((q, qIdx) => (
            <QuestionEditor
              key={q.id}
              index={qIdx}
              total={quiz.questions.length}
              question={q}
              onPatch={(patch) => patchQuestion(qIdx, patch)}
              onRemove={() => removeQuestion(qIdx)}
              onMoveUp={() => moveQuestion(qIdx, -1)}
              onMoveDown={() => moveQuestion(qIdx, 1)}
              onAddChoice={() => addChoice(qIdx)}
              onRemoveChoice={(cIdx) => removeChoice(qIdx, cIdx)}
              onPatchChoice={(cIdx, patch) => patchChoice(qIdx, cIdx, patch)}
            />
          ))}

          <MakoButton
            variant="secondary"
            className="self-start py-2 px-4 text-xs uppercase"
            onClick={addQuestion}
            type="button"
          >
            <Plus className="mr-1 inline h-3 w-3" /> Add question
          </MakoButton>
        </div>

        {/* Live validation summary */}
        <p
          className="text-xs tracking-widest"
          style={{
            fontFamily: "var(--font-mono-mako)",
            color: validationErrors.length ? "var(--mako-amber)" : "var(--mako-correct)",
          }}
        >
          {validationErrors.length
            ? `▸ ${validationErrors.length} ISSUE${validationErrors.length === 1 ? "" : "S"} REMAINING`
            : "▸ READY TO EXPORT"}
        </p>
      </main>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-sm font-bold tracking-widest uppercase"
      style={{ fontFamily: "var(--font-ui)", color: "var(--mako-ink)" }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"flex flex-col gap-2 " + (className ?? "")}>
      <Label
        className="text-[11px] tracking-widest uppercase"
        style={{ fontFamily: "var(--font-mono-mako)", color: "var(--mako-sub)" }}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

interface QuestionEditorProps {
  index: number;
  total: number;
  question: Question;
  onPatch: (patch: Partial<Question>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddChoice: () => void;
  onRemoveChoice: (cIdx: number) => void;
  onPatchChoice: (cIdx: number, patch: Partial<Choice>) => void;
}

function QuestionEditor({
  index,
  total,
  question,
  onPatch,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddChoice,
  onRemoveChoice,
  onPatchChoice,
}: QuestionEditorProps) {
  return (
    <MakoPanel className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHeading>Question {index + 1}</SectionHeading>
        <div className="flex flex-wrap gap-2">
          <IconBtn label="Move up" onClick={onMoveUp} disabled={index === 0}>
            <ArrowUp className="h-3 w-3" />
          </IconBtn>
          <IconBtn label="Move down" onClick={onMoveDown} disabled={index === total - 1}>
            <ArrowDown className="h-3 w-3" />
          </IconBtn>
          <IconBtn label="Remove question" onClick={onRemove} disabled={total <= 1} destructive>
            <Trash2 className="h-3 w-3" />
          </IconBtn>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-4">
          <Field label="Image URL">
            <Input
              value={question.imageUrl}
              onChange={(e) => onPatch({ imageUrl: e.target.value })}
              placeholder="https://…"
              className="border-[var(--mako-line)] bg-transparent"
              style={{ color: "var(--mako-ink)" }}
            />
          </Field>
          <Field label="Text fallback (optional)">
            <Input
              value={question.textFallback}
              onChange={(e) => onPatch({ textFallback: e.target.value })}
              placeholder="Shown if the image can't load"
              className="border-[var(--mako-line)] bg-transparent"
              style={{ color: "var(--mako-ink)" }}
            />
          </Field>
        </div>
        <ImageProbe url={question.imageUrl} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label
            className="text-[11px] tracking-widest uppercase"
            style={{ fontFamily: "var(--font-mono-mako)", color: "var(--mako-sub)" }}
          >
            Choices ({question.choices.length}/8) · pick the correct one
          </Label>
          <MakoButton
            variant="secondary"
            className="py-1 px-3 text-[11px] uppercase"
            onClick={onAddChoice}
            disabled={question.choices.length >= 8}
            type="button"
          >
            <Plus className="mr-1 inline h-3 w-3" /> Add choice
          </MakoButton>
        </div>

        <div className="flex flex-col gap-2">
          {question.choices.map((choice, cIdx) => (
            <ChoiceRow
              key={cIdx}
              index={cIdx}
              choice={choice}
              isCorrect={question.correctChoiceIndex === cIdx}
              canRemove={question.choices.length > 2}
              onMarkCorrect={() => onPatch({ correctChoiceIndex: cIdx })}
              onPatch={(patch) => onPatchChoice(cIdx, patch)}
              onRemove={() => onRemoveChoice(cIdx)}
              questionId={question.id}
            />
          ))}
        </div>
      </div>
    </MakoPanel>
  );
}

function ChoiceRow({
  index,
  choice,
  isCorrect,
  canRemove,
  onMarkCorrect,
  onPatch,
  onRemove,
  questionId,
}: {
  index: number;
  choice: Choice;
  isCorrect: boolean;
  canRemove: boolean;
  onMarkCorrect: () => void;
  onPatch: (patch: Partial<Choice>) => void;
  onRemove: () => void;
  questionId: string;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 p-2"
      style={{
        boxShadow: isCorrect
          ? "inset 0 0 0 1px var(--mako-correct), 0 0 10px var(--mako-glow)"
          : "inset 0 0 0 1px var(--mako-line-soft)",
        borderRadius: 2,
      }}
    >
      <label
        className="flex cursor-pointer items-center gap-2 px-2"
        title="Mark as correct"
      >
        <input
          type="radio"
          name={`correct-${questionId}`}
          checked={isCorrect}
          onChange={onMarkCorrect}
          className="accent-[var(--mako-correct)]"
        />
        <span
          className="text-[11px] tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mono-mako)", color: "var(--mako-sub)" }}
        >
          {String.fromCharCode(65 + index)}
        </span>
      </label>
      <select
        value={choice.type}
        onChange={(e) => onPatch({ type: e.target.value as Choice["type"] })}
        className="clip-mako px-2 py-1 text-xs"
        style={{
          fontFamily: "var(--font-ui)",
          background: "var(--mako-panel)",
          boxShadow: "inset 0 0 0 1px var(--mako-line)",
          color: "var(--mako-ink)",
        }}
        aria-label={`Choice ${index + 1} type`}
      >
        <option value="text">Text</option>
        <option value="image">Image URL</option>
      </select>
      <Input
        value={choice.value}
        onChange={(e) => onPatch({ value: e.target.value })}
        placeholder={choice.type === "image" ? "https://…" : "Answer text"}
        className="flex-1 min-w-[160px] border-[var(--mako-line)] bg-transparent"
        style={{ color: "var(--mako-ink)" }}
        aria-label={`Choice ${index + 1} value`}
      />
      <IconBtn label="Remove choice" onClick={onRemove} disabled={!canRemove} destructive>
        <Trash2 className="h-3 w-3" />
      </IconBtn>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="clip-mako px-2 py-1 text-xs transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        fontFamily: "var(--font-ui)",
        background: "var(--mako-panel)",
        boxShadow: `inset 0 0 0 1px ${destructive ? "var(--mako-wrong)" : "var(--mako-line)"}`,
        color: destructive ? "var(--mako-wrong)" : "var(--mako-ink)",
      }}
    >
      {children}
    </button>
  );
}

function ImageProbe({ url }: { url: string }) {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  // Reset when URL changes.
  useEffect(() => {
    setState(url.trim() ? "loading" : "idle");
  }, [url]);

  return (
    <div
      className="flex aspect-video w-full items-center justify-center overflow-hidden"
      style={{
        background: "var(--mako-panel)",
        boxShadow: "inset 0 0 0 1px var(--mako-line-soft)",
        borderRadius: 2,
      }}
    >
      {!url.trim() ? (
        <div
          className="flex flex-col items-center gap-1 text-[11px] tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mono-mako)", color: "var(--mako-sub)" }}
        >
          <ImageIcon className="h-4 w-4" />
          No image
        </div>
      ) : state === "error" ? (
        <div
          className="flex flex-col items-center gap-1 p-2 text-center text-[11px] tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mono-mako)", color: "var(--mako-wrong)" }}
        >
          <AlertTriangle className="h-4 w-4" />
          Image unavailable
        </div>
      ) : (
        <img
          src={url}
          alt="Question preview"
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          className="h-full w-full object-cover"
          style={{ display: state === "loading" ? "none" : "block" }}
        />
      )}
      {state === "loading" && url.trim() && (
        <span
          className="text-[11px] tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mono-mako)", color: "var(--mako-sub)" }}
        >
          Loading…
        </span>
      )}
    </div>
  );
}
