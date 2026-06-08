import { Link } from "@tanstack/react-router";
import { MakoPanel } from "@/components/mako";
import type { QuizIndexEntry } from "@/lib/types";

export function QuizCard({ quiz }: { quiz: QuizIndexEntry }) {
  return (
    <MakoPanel className="flex flex-col gap-4 p-5">
      <div className="flex-1">
        <h3
          className="text-lg font-bold leading-tight"
          style={{ fontFamily: 'var(--font-ui)', color: 'var(--mako-teal)', textShadow: '0 0 10px var(--mako-glow)' }}
        >
          {quiz.title}
        </h3>
        {quiz.description && (
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--mako-sub)' }}>
            {quiz.description}
          </p>
        )}
      </div>

      <div
        className="flex items-center gap-4 text-[11px] tracking-widest"
        style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
      >
        <span>
          <span style={{ color: 'var(--mako-amber)' }}>{quiz.questionCount}</span>{' '}
          QUESTIONS
        </span>
        <span>
          <span style={{ color: 'var(--mako-amber)' }}>{quiz.timeLimitSeconds}</span>s/Q
        </span>
      </div>

      <Link
        to="/quiz/$quizId"
        params={{ quizId: quiz.id }}
        className="clip-mako block px-4 py-3 text-center text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-90"
        style={{
          fontFamily: 'var(--font-ui)',
          background: 'linear-gradient(160deg, var(--mako-teal), var(--mako-correct))',
          color: '#04120d',
        }}
      >
        Start Quiz
      </Link>

      <Link
        to="/quiz/$quizId/leaderboard"
        params={{ quizId: quiz.id }}
        className="text-center text-[11px] tracking-widest transition-colors hover:text-[var(--mako-teal)]"
        style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
      >
        VIEW LEADERBOARD
      </Link>
    </MakoPanel>
  );
}
