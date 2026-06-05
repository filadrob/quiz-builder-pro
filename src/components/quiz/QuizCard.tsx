import { Link } from "@tanstack/react-router";
import { Clock, ListChecks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QuizIndexEntry } from "@/lib/types";

export function QuizCard({ quiz }: { quiz: QuizIndexEntry }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{quiz.title}</CardTitle>
        <CardDescription>{quiz.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ListChecks className="h-4 w-4" /> {quiz.questionCount} questions
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" /> {quiz.timeLimitSeconds}s each
          </span>
        </div>
        <Button asChild>
          <Link to="/quiz/$quizId" params={{ quizId: quiz.id }}>
            Start quiz
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
