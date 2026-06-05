import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  correct: boolean;
  points: number;
  onContinue: () => void;
}

export function FeedbackInterstitial({ correct, points, onContinue }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center">
      {correct ? (
        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
      ) : (
        <XCircle className="h-16 w-16 text-destructive" />
      )}
      <h2 className="text-2xl font-bold">{correct ? "Correct!" : "Incorrect"}</h2>
      <p className="text-muted-foreground">
        {correct ? `+${points} points` : "0 points"}
      </p>
      <Button onClick={onContinue} autoFocus>
        Continue
      </Button>
    </div>
  );
}
