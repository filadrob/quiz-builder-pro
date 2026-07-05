import { toBlob } from "html-to-image";
import { CARD_WIDTH, CARD_HEIGHT } from "@/components/quiz/ShareCard";

const FONTS_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Share+Tech+Mono&display=swap";

let cachedFontCSS: string | null = null;

async function fetchAndInlineFonts(): Promise<string> {
  if (cachedFontCSS) return cachedFontCSS;
  try {
    const cssRes = await fetch(FONTS_CSS_URL, {
      headers: {
        // Ask Google for woff2 URLs.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    });
    let css = await cssRes.text();
    // Inline every url(...) reference as a data URL so the export is self-contained.
    const urls = Array.from(new Set(css.match(/https:\/\/[^)]+\.woff2/g) ?? []));
    await Promise.all(
      urls.map(async (u) => {
        try {
          const res = await fetch(u);
          const buf = await res.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          const dataUrl = `data:font/woff2;base64,${b64}`;
          css = css.split(u).join(dataUrl);
        } catch {
          /* ignore individual font failures */
        }
      })
    );
    cachedFontCSS = css;
    return css;
  } catch {
    return "";
  }
}

async function renderCardBlob(node: HTMLElement): Promise<Blob> {
  const fontEmbedCSS = await fetchAndInlineFonts();
  const blob = await toBlob(node, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    fontEmbedCSS,
    style: {
      transform: "none",
      margin: "0",
    },
  });
  if (!blob) throw new Error("Failed to render card");
  return blob;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadShareCard(node: HTMLElement, filename = "quiz-result.png") {
  const blob = await renderCardBlob(node);
  downloadBlob(blob, filename);
}

export async function copyShareCard(
  node: HTMLElement,
  fallbackFilename = "quiz-result.png"
): Promise<"copied" | "downloaded"> {
  const blob = await renderCardBlob(node);
  const nav = navigator as Navigator & {
    clipboard?: { write?: (items: ClipboardItem[]) => Promise<void> };
  };
  const CI = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
  if (nav.clipboard?.write && CI) {
    try {
      await nav.clipboard.write([new CI({ [blob.type]: blob })]);
      return "copied";
    } catch {
      /* fall through */
    }
  }
  downloadBlob(blob, fallbackFilename);
  return "downloaded";
}
