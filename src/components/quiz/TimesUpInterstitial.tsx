import { Clock } from "lucide-react";

export function TimesUpInterstitial() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center">
      <Clock className="h-12 w-12 text-amber-500" />
      <h2 className="text-2xl font-bold">Time's up!</h2>
      <p className="text-muted-foreground">Moving to next question…</p>
    </div>
  );
}
