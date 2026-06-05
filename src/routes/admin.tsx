import { createFileRoute } from "@tanstack/react-router";
import { QuizBuilderForm } from "@/components/admin/QuizBuilderForm";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Quiz Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <h1 className="text-xl font-bold">Quiz Builder</h1>
          <p className="text-sm text-muted-foreground">
            Build a quiz and export it as JSON. No login, no server.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <QuizBuilderForm />
      </main>
    </div>
  );
}
