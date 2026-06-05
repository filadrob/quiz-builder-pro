export function AdminInstructionsPanel({ quizId }: { quizId: string }) {
  return (
    <div className="rounded-lg border bg-secondary/40 p-4 text-sm">
      <h3 className="mb-2 font-semibold">Publishing checklist</h3>
      <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
        <li>
          Click <strong>Export JSON</strong> and save the file as{" "}
          <code className="rounded bg-background px-1">public/quizzes/{quizId || "your-quiz-id"}.json</code>.
        </li>
        <li>Commit and deploy so the JSON is served at a public URL.</li>
        <li>
          In your quiz spreadsheet, add a row to the <strong>Quizzes</strong> tab with:
          id, title, description, questionCount, timeLimitSeconds, jsonUrl.
        </li>
        <li>
          Create a new tab in the same spreadsheet named exactly{" "}
          <code className="rounded bg-background px-1">{quizId || "your-quiz-id"}</code> — the
          Apps Script will write leaderboard rows there.
        </li>
      </ol>
    </div>
  );
}
