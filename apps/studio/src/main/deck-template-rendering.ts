import type {
  StudioDeckMode,
  StudioDeckSlide,
  StudioDeckSlideContent,
} from "../shared/studio-api";

export type DeckDimensions = { width: number; height: number };

const DECK_WIDTH = 1920;
const DECK_HEIGHT = 1080;
const PPTX_SAFE_DECK_WIDTH = 1280;
const PPTX_SAFE_DECK_HEIGHT = 720;

export function buildSlides(contents: StudioDeckSlideContent[]): StudioDeckSlide[] {
  const labels = ["Cover", "Narrative", "Problem", "Solution", "Proof", "Roadmap", "Closing"];
  return contents.map((content, index) => {
    const n = String(index + 1).padStart(2, "0");
    const label = content.label?.trim() || labels[index] || `Slide ${index + 1}`;
    return {
      id: `slide-${n}`,
      file: `slides/${n}-${slugify(label)}.html`,
      label,
      title: content.title,
      notes: content.notes?.trim() || undefined,
    };
  });
}

export function renderSlideHtml({
  title,
  slide,
  content,
  index,
  total,
  mode,
}: {
  title: string;
  slide: StudioDeckSlide;
  content: StudioDeckSlideContent;
  index: number;
  total: number;
  mode: StudioDeckMode;
}) {
  const isCover = index === 0;
  const dimensions = getDeckDimensionsForMode(mode);
  const safeNote =
    mode === "pptx-safe"
      ? "PPTX-safe: text stays in p/h tags, images use img tags, gradients and web components are avoided."
      : "Freeform HTML source: PDF and browser presentation are the primary exports.";

  const points = (content.points && content.points.length > 0
    ? content.points
    : [
        "Models learn statistical patterns from examples.",
        "Training adjusts internal weights to reduce errors.",
        "Inference applies those learned weights to new inputs.",
      ]
  ).slice(0, 5);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=${dimensions.width},height=${dimensions.height}">
<title>${escapeHtml(title)} · ${escapeHtml(slide.label)}</title>
<link rel="stylesheet" href="../shared/tokens.css">
<link rel="stylesheet" href="../shared/tweaks.css">
</head>
<body>
  <main class="slide ${isCover ? "cover" : ""}">
    <header class="masthead">
      <p>Studio Deck</p>
      <p>${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</p>
    </header>
    <section class="content">
      <p class="kicker">${escapeHtml(slide.label)}</p>
      <h1>${escapeHtml(content.title || (isCover ? title : slide.title))}</h1>
      <p class="lede">${escapeHtml(content.lede || safeNote)}</p>
      <div class="process">
        ${points
          .map(
            (point, pointIndex) => `<article>
          <p class="eyebrow">Step ${String(pointIndex + 1).padStart(2, "0")}</p>
          <h2>${escapeHtml(point.split(":")[0] || point)}</h2>
          <p>${escapeHtml(point.includes(":") ? point.split(":").slice(1).join(":").trim() : point)}</p>
        </article>`,
          )
          .join("\n        ")}
      </div>
    </section>
  </main>
</body>
</html>
`;
}

export function renderTokensCss(mode: StudioDeckMode) {
  const { width, height } = getDeckDimensionsForMode(mode);
  const background =
    mode === "pptx-safe"
      ? "#faf8f1"
      : "radial-gradient(circle at 20% 0%, rgba(215,255,114,.18), transparent 30%), #faf8f1";
  const kickerBorder =
    mode === "pptx-safe"
      ? ""
      : "border: 1px solid rgba(23,23,20,.2); border-radius: 999px;";
  return `* { box-sizing: border-box; }
html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; }
body { background: var(--studio-bg, ${background}); color: var(--studio-fg, #171714); font-family: Georgia, "Times New Roman", serif; }
.slide { position: relative; width: ${width}px; height: ${height}px; padding: calc(58px * var(--studio-density-scale, 1)) calc(76px * var(--studio-density-scale, 1)) calc(64px * var(--studio-density-scale, 1)); }
.masthead { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(23,23,20,.18); padding-bottom: 18px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: .12em; text-transform: uppercase; font-size: 16px; color: rgba(23,23,20,.55); }
.content { height: calc(100% - 50px); display: flex; flex-direction: column; justify-content: center; gap: var(--studio-gap, 28px); }
.kicker { width: fit-content; ${kickerBorder} padding: 8px 14px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 15px; letter-spacing: .16em; text-transform: uppercase; }
h1 { max-width: 1240px; margin: 0; font-size: calc(118px * var(--studio-density-scale, 1)); line-height: .95; letter-spacing: -.055em; text-wrap: balance; }
.cover h1 { max-width: 1500px; font-size: calc(150px * var(--studio-density-scale, 1)); }
.lede { max-width: 980px; margin: 0; font-size: calc(30px * var(--studio-density-scale, 1)); line-height: 1.35; color: rgba(23,23,20,.72); text-wrap: pretty; }
.process { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--studio-gap, 28px); max-width: 1440px; margin-top: 12px; }
article { border-top: 1px solid rgba(23,23,20,.18); padding-top: 22px; }
.eyebrow { margin: 0 0 14px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; letter-spacing: .14em; text-transform: uppercase; color: rgba(23,23,20,.5); }
h2 { margin: 0 0 12px; font-size: calc(36px * var(--studio-density-scale, 1)); letter-spacing: -.02em; }
article p:last-child { margin: 0; max-width: 520px; font-size: calc(22px * var(--studio-density-scale, 1)); line-height: 1.55; color: rgba(23,23,20,.68); }
`;
}

export function getDeckDimensionsForMode(mode: StudioDeckMode): DeckDimensions {
  return mode === "pptx-safe"
    ? { width: PPTX_SAFE_DECK_WIDTH, height: PPTX_SAFE_DECK_HEIGHT }
    : { width: DECK_WIDTH, height: DECK_HEIGHT };
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "deck"
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
