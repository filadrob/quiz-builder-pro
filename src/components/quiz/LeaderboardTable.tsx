import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LeaderboardEntry } from "@/lib/types";
import { formatDate, formatScore, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LeaderboardTable({
  entries,
  highlight,
}: {
  entries: LeaderboardEntry[];
  highlight?: { name: string; score: number } | null;
}) {
  if (!entries.length) {
    return (
      <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        No scores yet. Be the first!
      </p>
    );
  }
  let highlightedOnce = false;
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Time</TableHead>
            <TableHead className="hidden text-right md:table-cell">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e, i) => {
            const displayName = e.isAnonymous ? "Anonymous" : e.name || "Anonymous";
            const isHighlight =
              !highlightedOnce &&
              !!highlight &&
              displayName === (highlight.name || "Anonymous") &&
              e.score === highlight.score;
            if (isHighlight) highlightedOnce = true;
            return (
              <TableRow
                key={`${e.name}-${e.timestamp}-${i}`}
                className={cn(isHighlight && "bg-amber-100/60 dark:bg-amber-500/10")}
              >
                <TableCell className="font-semibold">{i + 1}</TableCell>
                <TableCell>{displayName}{isHighlight && <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">(you)</span>}</TableCell>
                <TableCell className="text-right tabular-nums">{formatScore(e.score)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatTime(e.totalTime)}</TableCell>
                <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                  {formatDate(e.timestamp)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
