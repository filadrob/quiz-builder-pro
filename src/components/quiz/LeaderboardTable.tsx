import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LeaderboardEntry } from "@/lib/types";

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (!entries.length) {
    return (
      <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        No scores yet. Be the first!
      </p>
    );
  }
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Time</TableHead>
            <TableHead className="hidden text-right md:table-cell">Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e, i) => (
            <TableRow key={`${e.name}-${e.timestamp}-${i}`}>
              <TableCell className="font-semibold">{i + 1}</TableCell>
              <TableCell>{e.isAnonymous ? "Anonymous" : e.name || "Anonymous"}</TableCell>
              <TableCell className="text-right tabular-nums">{e.score}</TableCell>
              <TableCell className="text-right tabular-nums">{e.totalTime.toFixed(1)}s</TableCell>
              <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                {formatDate(e.timestamp)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDate(s: string): string {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}
