import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuestionEditor } from "./QuestionEditor";
import { AdminInstructionsPanel } from "./AdminInstructionsPanel";
import type { Question, Quiz } from "@/lib/types";
import { Download, Plus } from "lucide-react";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function rand(): string {
  return Math.random().toString(36).slice(2, 8);
}

function emptyQuestion(): Question {
  return {
    id: `q_${rand()}`,
    imageUrl: "",
    choices: [
      { type: "text", value: "" },
      { type: "text", value: "" },
    ],
    correctChoiceIndex: 0,
  };
}

export function QuizBuilderForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(20);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  const quizId = useMemo(
    () => (title ? `${slugify(title)}-${rand()}` : ""),
    // ID is regenerated on title change so a fresh export gets a fresh suffix
    [title],
  );

  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!title.trim()) errors.push("Title is required.");
    if (timeLimit <= 0) errors.push("Time limit must be > 0.");
    if (questions.length === 0) errors.push("Add at least one question.");
    questions.forEach((q, i) => {
      if (!q.imageUrl.trim()) errors.push(`Question ${i + 1}: image URL is required.`);
      if (q.choices.length < 2) errors.push(`Question ${i + 1}: at least 2 choices.`);
      if (q.choices.length > 8) errors.push(`Question ${i + 1}: at most 8 choices.`);
      if (q.choices.some((c) => !c.value.trim())) errors.push(`Question ${i + 1}: all choices need a value.`);
      if (
        q.correctChoiceIndex < 0 ||
        q.correctChoiceIndex >= q.choices.length
      ) {
        errors.push(`Question ${i + 1}: mark a correct answer.`);
      }
    });
    return errors;
  }, [title, timeLimit, questions]);

  const updateQuestion = (i: number, next: Question) => {
    const copy = questions.slice();
    copy[i] = next;
    setQuestions(copy);
  };
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));
  const moveQuestion = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const copy = questions.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setQuestions(copy);
  };
  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const exportJson = () => {
    const quiz: Quiz = {
      id: quizId,
      title: title.trim(),
      description: description.trim(),
      timeLimitSeconds: timeLimit,
      questions,
    };
    const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quiz.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold">Quiz metadata</h2>
        <div className="grid gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="time">Time limit per question (seconds)</Label>
            <Input
              id="time"
              type="number"
              min={1}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value) || 0)}
            />
          </div>
          {quizId && (
            <p className="text-xs text-muted-foreground">
              Generated quiz id: <code className="rounded bg-secondary px-1">{quizId}</code>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            onChange={(next) => updateQuestion(i, next)}
            onRemove={() => removeQuestion(i)}
            onMove={(dir) => moveQuestion(i, dir)}
          />
        ))}
        <Button type="button" variant="outline" onClick={addQuestion}>
          <Plus className="mr-1 h-4 w-4" /> Add question
        </Button>
      </div>

      {validation.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="mb-1 font-semibold text-destructive">Fix before export:</p>
          <ul className="list-disc pl-5 text-destructive/90">
            {validation.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={exportJson} disabled={validation.length > 0} size="lg">
          <Download className="mr-2 h-4 w-4" /> Export JSON
        </Button>
        <span className="text-xs text-muted-foreground">
          Saves a JSON file you can commit to <code>public/quizzes/</code>.
        </span>
      </div>

      <AdminInstructionsPanel quizId={quizId} />
    </div>
  );
}
