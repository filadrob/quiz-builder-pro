import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2 } from "lucide-react";
import type { Choice, ChoiceType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  choice: Choice;
  index: number;
  groupName: string;
  isCorrect: boolean;
  canRemove: boolean;
  onChange: (next: Choice) => void;
  onCorrect: () => void;
  onRemove: () => void;
}

export function ChoiceEditor({
  choice,
  index,
  groupName,
  isCorrect,
  canRemove,
  onChange,
  onCorrect,
  onRemove,
}: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border p-3",
        isCorrect && "border-emerald-500 bg-emerald-500/5",
      )}
    >
      <div className="flex items-center gap-3">
        <RadioGroup
          value={isCorrect ? `${index}` : ""}
          onValueChange={() => onCorrect()}
          className="flex"
        >
          <RadioGroupItem value={`${index}`} id={`${groupName}-correct-${index}`} />
        </RadioGroup>
        <Label htmlFor={`${groupName}-correct-${index}`} className="text-xs">
          Correct
        </Label>
        <div className="ml-auto flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => onChange({ ...choice, type: "text" })}
            className={cn(
              "rounded px-2 py-1",
              choice.type === "text" ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...choice, type: "image" })}
            className={cn(
              "rounded px-2 py-1",
              choice.type === "image" ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            Image
          </button>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Remove choice"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Input
        value={choice.value}
        onChange={(e) => {
          setImgError(false);
          onChange({ ...choice, value: e.target.value });
        }}
        placeholder={choice.type === "image" ? "https://image.url/..." : `Choice ${index + 1}`}
        className={imgError ? "border-destructive" : ""}
      />
      {choice.type === "image" && choice.value && (
        <img
          src={choice.value}
          alt={`Choice ${index + 1} preview`}
          className="max-h-24 w-auto rounded border object-contain"
          onError={() => setImgError(true)}
          onLoad={() => setImgError(false)}
        />
      )}
    </div>
  );
}
