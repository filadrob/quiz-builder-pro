import { forwardRef } from "react";
import type { AnswerRecord, Quiz } from "@/lib/types";
import { formatTime, formatScore } from "@/lib/format";
import { tierForPct, POINTS_PER_QUESTION } from "@/lib/share-card";

export interface ShareCardProps {
  quiz: Quiz;
  answers: AnswerRecord[];
  totalScore: number;
  totalTime: number;
}

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 675;

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ quiz, answers, totalScore, totalTime }, ref) => {
    const totalQuestions = answers.length;
    const correctCount = answers.filter((a) => a.correct).length;
    const maxScore = totalQuestions * POINTS_PER_QUESTION;
    const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const tier = tierForPct(pct);

    const wrongOrMissed = answers.filter((a) => !a.correct || a.skipped || a.timedOut).length;
    const flawless = totalQuestions > 0 && wrongOrMissed === 0;
    const avgResponse = totalQuestions > 0 ? totalTime / totalQuestions : 0;
    const speedRun = avgResponse > 0 && avgResponse <= 0.4 * quiz.timeLimitSeconds;

    // Inline styles — no CSS vars — so html-to-image renders identically.
    const ink = "#e3f6ef";
    const sub = "#74a89a";
    const teal = "#46e0b0";
    const line = "rgba(70,224,176,0.55)";

    return (
      <div
        ref={ref}
        style={{
          width: `${CARD_WIDTH}px`,
          height: `${CARD_HEIGHT}px`,
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(120% 100% at 50% 0%, #0a241d 0%, #04120d 55%, #010705 100%)",
          fontFamily: "'Chakra Petch', sans-serif",
          color: ink,
          padding: "56px 64px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          clipPath:
            "polygon(28px 0%, 100% 0%, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0% 100%, 0% 28px)",
          boxShadow: `inset 0 0 0 2px ${line}`,
        }}
      >
        {/* Scanlines overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,.5) 0 1px, transparent 1px 3px)",
            opacity: 0.15,
            mixBlendMode: "overlay",
          }}
        />
        {/* Corner accents */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            width: 60,
            height: 2,
            background: teal,
            boxShadow: `0 0 8px ${teal}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            width: 2,
            height: 60,
            background: teal,
            boxShadow: `0 0 8px ${teal}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            width: 60,
            height: 2,
            background: teal,
            boxShadow: `0 0 8px ${teal}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            width: 2,
            height: 60,
            background: teal,
            boxShadow: `0 0 8px ${teal}`,
          }}
        />

        {/* Header */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 20,
              letterSpacing: "0.35em",
              color: sub,
              textTransform: "uppercase",
            }}
          >
            ▸ DUTY LOG // RESULTS
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 54,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "0.01em",
              color: ink,
              textShadow: `0 0 18px ${line}`,
              maxWidth: "95%",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {quiz.title}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 18,
                letterSpacing: "0.3em",
                color: sub,
                textTransform: "uppercase",
              }}
            >
              SCORE
            </div>
            <div
              style={{
                fontSize: 180,
                lineHeight: 0.9,
                fontWeight: 700,
                color: tier.color,
                textShadow: `0 0 32px ${tier.glow}, 0 0 8px ${tier.glow}`,
                letterSpacing: "-0.02em",
              }}
            >
              {formatScore(totalScore)}
            </div>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 22,
                color: sub,
                letterSpacing: "0.15em",
              }}
            >
              / {formatScore(maxScore)} · {pct.toFixed(0)}%
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 20,
              minWidth: 340,
            }}
          >
            {/* Tier label */}
            <div
              style={{
                padding: "16px 28px",
                background: "rgba(0,0,0,0.35)",
                boxShadow: `inset 0 0 0 2px ${tier.color}, 0 0 24px ${tier.glow}`,
                clipPath:
                  "polygon(14px 0%, 100% 0%, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0% 100%, 0% 14px)",
                fontSize: 44,
                fontWeight: 700,
                letterSpacing: "0.16em",
                color: tier.color,
                textShadow: `0 0 14px ${tier.glow}`,
              }}
            >
              {tier.label}
            </div>

            {/* Mono readouts */}
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 26,
                color: ink,
                letterSpacing: "0.12em",
                textAlign: "right",
                lineHeight: 1.5,
              }}
            >
              <div>
                <span style={{ color: sub }}>ACC ▸ </span>
                {correctCount} / {totalQuestions} CORRECT
              </div>
              <div>
                <span style={{ color: sub }}>TIME ▸ </span>
                {formatTime(totalTime)}
              </div>
            </div>

            {/* Stamps */}
            {(flawless || speedRun) && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {flawless && <Stamp label="FLAWLESS" color="#ffb454" />}
                {speedRun && <Stamp label="SPEED RUN" color="#46e0b0" />}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 16,
            letterSpacing: "0.28em",
            color: sub,
            textTransform: "uppercase",
            borderTop: `1px solid ${line}`,
            paddingTop: 20,
          }}
        >
          <span>MAKO // QUIZ PLATFORM</span>
          <span>◇ {totalQuestions} QUESTIONS ◇</span>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";

function Stamp({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        padding: "8px 16px",
        border: `2px solid ${color}`,
        color,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 18,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        transform: "rotate(-3deg)",
        textShadow: `0 0 10px ${color}`,
        boxShadow: `0 0 12px ${color}55`,
        background: "rgba(0,0,0,0.4)",
      }}
    >
      {label}
    </div>
  );
}
