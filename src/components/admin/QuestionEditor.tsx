import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChoiceEditor } from "./ChoiceEditor";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { Choice, Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isVideoUrl } from "@/lib/image";

interface Props {
  question: Question;
  index: number;
  total: number;
  onChange: (q: Question) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

export function QuestionEditor({ question, index, total, onChange, onRemove, onMove }: Props) {
  const [imgError, setImgError] = useState(false);

  const updateChoice = (ci: number, next: Choice) => {
    const choices = question.choices.slice();
    choices[ci] = next;
    onChange({ ...question, choices });
  };
  const addChoice = () => {
    if (question.choices.length >= 8) return;
    onChange({
      ...question,
      choices: [...question.choices, { type: "text", value: "" }],
    });
  };
  const removeChoice = (ci: number) => {
    if (question.choices.length <= 2) return;
    const choices = question.choices.filter((_, i) => i !== ci);
    let correct = question.correctChoiceIndex;
    if (correct === ci) correct = 0;
    else if (correct > ci) correct -= 1;
    onChange({ ...question, choices, correctChoiceIndex: correct });
  };
  const setCorrect = (ci: number) => onChange({ ...question, correctChoiceIndex: ci });

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Question {index + 1}</h3>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move down">
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={onRemove} aria-label="Remove question">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`img-${question.id}`}>Image URL</Label>
          <Input
            id={`img-${question.id}`}
            value={question.imageUrl}
            onChange={(e) => {
              setImgError(false);
              onChange({ ...question, imageUrl: e.target.value });
            }}
            placeholder="https://example.com/image.jpg"
            className={cn(imgError && "border-destructive")}
          />
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="Question preview"
              className="max-h-48 w-auto rounded border object-contain"
              onError={() => setImgError(true)}
              onLoad={() => setImgError(false)}
            />
          )}
          {imgError && <p className="text-xs text-destructive">Image failed to load.</p>}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Answer choices (2–8)</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addChoice}
              disabled={question.choices.length >= 8}
            >
              <Plus className="mr-1 h-4 w-4" /> Add choice
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {question.choices.map((c, ci) => (
              <ChoiceEditor
                key={ci}
                choice={c}
                index={ci}
                groupName={`q-${question.id}`}
                isCorrect={question.correctChoiceIndex === ci}
                canRemove={question.choices.length > 2}
                onChange={(next) => updateChoice(ci, next)}
                onCorrect={() => setCorrect(ci)}
                onRemove={() => removeChoice(ci)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
