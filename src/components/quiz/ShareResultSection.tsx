import { useEffect, useRef, useState } from "react";
import { Share2, Download, Copy } from "lucide-react";
import { MakoButton, MakoPanel } from "@/components/mako";
import { ShareCard, CARD_WIDTH, CARD_HEIGHT } from "@/components/quiz/ShareCard";
import { downloadShareCard, copyShareCard } from "@/lib/share-export";
import type { AnswerRecord, Quiz } from "@/lib/types";

interface ShareResultSectionProps {
  quiz: Quiz;
  answers: AnswerRecord[];
  totalScore: number;
  totalTime: number;
}

type Status =
  | { kind: "idle" }
  | { kind: "working"; msg: string }
  | { kind: "success"; msg: string }
  | { kind: "error"; msg: string };

export function ShareResultSection({
  quiz,
  answers,
  totalScore,
  totalTime,
}: ShareResultSectionProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    const el = previewFrameRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / CARD_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filename = `${quiz.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "quiz"}-result.png`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setStatus({ kind: "working", msg: "Rendering…" });
    try {
      await downloadShareCard(cardRef.current, filename);
      setStatus({ kind: "success", msg: "Card downloaded ✓" });
    } catch (e) {
      setStatus({ kind: "error", msg: e instanceof Error ? e.message : "Export failed" });
    }
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;
    setStatus({ kind: "working", msg: "Rendering…" });
    try {
      const result = await copyShareCard(cardRef.current, filename);
      setStatus({
        kind: "success",
        msg: result === "copied" ? "Copied to clipboard ✓" : "Clipboard unsupported — downloaded instead",
      });
    } catch (e) {
      setStatus({ kind: "error", msg: e instanceof Error ? e.message : "Export failed" });
    }
  };

  return (
    <MakoPanel className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5" style={{ color: "var(--mako-teal)" }} />
        <span
          className="text-sm font-bold tracking-widest uppercase"
          style={{ fontFamily: "var(--font-ui)", color: "var(--mako-ink)" }}
        >
          Share your result
        </span>
      </div>

      {/* Preview — responsive, scaled from the real 1200x675 card */}
      <div
        ref={previewFrameRef}
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}`,
          boxShadow: "inset 0 0 0 1px var(--mako-line-soft)",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          }}
        >
          <ShareCard
            ref={cardRef}
            quiz={quiz}
            answers={answers}
            totalScore={totalScore}
            totalTime={totalTime}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <MakoButton
          className="py-3 px-5 text-sm uppercase"
          onClick={handleDownload}
          disabled={status.kind === "working"}
        >
          <Download className="mr-2 inline h-4 w-4" />
          Download card
        </MakoButton>
        <MakoButton
          variant="secondary"
          className="py-3 px-5 text-sm uppercase"
          onClick={handleCopy}
          disabled={status.kind === "working"}
        >
          <Copy className="mr-2 inline h-4 w-4" />
          Copy image
        </MakoButton>
      </div>

      {status.kind !== "idle" && (
        <p
          className="text-xs tracking-widest"
          style={{
            fontFamily: "var(--font-mono-mako)",
            color:
              status.kind === "error"
                ? "var(--mako-wrong)"
                : status.kind === "success"
                ? "var(--mako-correct)"
                : "var(--mako-sub)",
          }}
        >
          {status.msg.toUpperCase()}
        </p>
      )}
    </MakoPanel>
  );
}
