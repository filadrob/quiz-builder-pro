// Built-in sample quizzes for the admin builder's Test Play.
// Fully self-contained — SVG data URIs, no network requests.

import type { Choice, Question, Quiz } from "@/lib/types";

type QuizStatus = "draft" | "published" | "archived";
type EditorQuiz = Quiz & { status: QuizStatus };

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function wrapText(text: string, maxChars = 22, maxLines = 4): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = w;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function textCardSvg(text: string): string {
  const lines = wrapText(text);
  const lineHeight = 44;
  const startY = 225 - ((lines.length - 1) * lineHeight) / 2 + 12;
  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="400" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450"><rect width="800" height="450" fill="#04120d"/><rect x="0" y="0" width="800" height="6" fill="#46e0b0"/><text x="24" y="34" font-family="monospace" font-size="14" fill="#46e0b0" letter-spacing="2">FFXIV // DUTY LOG</text><text text-anchor="middle" font-family="monospace" font-size="30" fill="#cdeee4">${tspans}</text></svg>`;
  return svgDataUri(svg);
}

export function shapeCardSvg(shapeMarkup: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450"><rect width="800" height="450" fill="#04120d"/><g fill="#46e0b0">${shapeMarkup}</g></svg>`;
  return svgDataUri(svg);
}

function textChoices(values: string[]): Choice[] {
  return values.map((v) => ({ type: "text" as const, value: v }));
}

export function makeShapesQuiz(): EditorQuiz {
  const fallback = "Which shape is shown?";
  const q = (
    id: string,
    shape: string,
    choices: string[],
    correctIdx: number
  ): Question => ({
    id,
    imageUrl: shapeCardSvg(shape),
    textFallback: fallback,
    choices: textChoices(choices),
    correctChoiceIndex: correctIdx,
  });

  return {
    id: "shapes-sample",
    title: "Sample Test Duty — Shapes",
    description: "",
    timeLimitSeconds: 20,
    status: "draft",
    questions: [
      q("shape-triangle", '<polygon points="400,70 545,370 255,370"/>', ["Triangle", "Square", "Circle", "Star"], 0),
      q("shape-circle", '<circle cx="400" cy="225" r="140"/>', ["Circle", "Triangle", "Star", "Square"], 0),
      q("shape-square", '<rect x="260" y="85" width="280" height="280"/>', ["Square", "Star", "Circle", "Triangle"], 0),
      q(
        "shape-star",
        '<polygon points="400,75 436,175 543,179 459,244 488,346 400,287 312,346 341,244 257,179 364,175"/>',
        ["Star", "Hexagon", "Triangle", "Circle"],
        0
      ),
    ],
  };
}

export function makeFfxivQuiz(): EditorQuiz {
  const q = (
    id: string,
    text: string,
    choices: string[],
    correctIdx: number
  ): Question => ({
    id,
    imageUrl: textCardSvg(text),
    textFallback: text,
    choices: textChoices(choices),
    correctChoiceIndex: correctIdx,
  });

  return {
    id: "ffxiv-job-basics",
    title: "FFXIV — Job & Realm Basics",
    description: "Built-in trivia sample. Evergreen Eorzean lore.",
    timeLimitSeconds: 25,
    status: "draft",
    questions: [
      q("ffxiv-q1", "Which job wields a lance (polearm) as its primary weapon?", ["Dragoon", "Monk", "Samurai", "White Mage"], 0),
      q("ffxiv-q2", "What do Moogles famously say at the end of their sentences?", ['"Kupo"', '"Wark"', '"Kweh"', '"Mog"'], 0),
      q("ffxiv-q3", "Which primal is known as the Lord of the Inferno?", ["Ifrit", "Titan", "Garuda", "Ramuh"], 0),
      q("ffxiv-q4", "Which city-state is ruled by a Sultana, in the desert of Thanalan?", ["Ul'dah", "Gridania", "Limsa Lominsa", "Ishgard"], 0),
      q("ffxiv-q5", "Which tank job wields a sword and shield?", ["Paladin", "Warrior", "Dark Knight", "Gunbreaker"], 0),
      q("ffxiv-q6", "What flightless bird is the iconic rideable mount across Eorzea?", ["Chocobo", "Moogle", "Amaro", "Griffin"], 0),
    ],
  };
}
