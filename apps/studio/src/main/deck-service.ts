import { BrowserWindow, shell } from "electron";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type {
  StudioCreateDeckInput,
  StudioDeckMode,
  StudioDeckProject,
  StudioDeckSlide,
  StudioDeckSlideContent,
  StudioExportDeckInput,
  StudioExportDeckResult,
} from "../shared/studio-api";

const DECK_WIDTH = 1920;
const DECK_HEIGHT = 1080;

type StoredDeckManifest = Omit<StudioDeckProject, "previewUrl">;

export class StudioDeckService {
  constructor(private readonly rootDir: string) {}

  getArtifactPath(artifactId: string): string {
    return join(this.rootDir, safeDeckId(artifactId));
  }

  async ensureArtifactWorkspace(artifactId: string): Promise<string> {
    const artifactPath = this.getArtifactPath(artifactId);
    await Promise.all([
      mkdir(join(artifactPath, "slides"), { recursive: true }),
      mkdir(join(artifactPath, "shared"), { recursive: true }),
      mkdir(join(artifactPath, "assets"), { recursive: true }),
      mkdir(join(artifactPath, "output"), { recursive: true }),
    ]);
    return artifactPath;
  }

  async listDecks(): Promise<StudioDeckProject[]> {
    await mkdir(this.rootDir, { recursive: true });
    const entries = await readdir(this.rootDir, { withFileTypes: true });
    const decks = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => this.readDeck(entry.name).catch(() => undefined)),
    );
    return decks
      .filter((deck): deck is StudioDeckProject => Boolean(deck))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async createDeck(input: StudioCreateDeckInput = {}): Promise<StudioDeckProject> {
    await mkdir(this.rootDir, { recursive: true });
    const now = Date.now();
    const title = sanitizeTitle(input.title || "Untitled launch deck");
    const id = `${slugify(title)}-${now.toString(36)}`;
    const mode = input.mode ?? "freeform";
    const slideContents = normalizeSlideContents(input);
    const slideCount = slideContents.length;
    const deckPath = join(this.rootDir, id);
    const slidesPath = join(deckPath, "slides");
    const sharedPath = join(deckPath, "shared");
    const outputPath = join(deckPath, "output");

    await Promise.all([
      mkdir(slidesPath, { recursive: true }),
      mkdir(sharedPath, { recursive: true }),
      mkdir(outputPath, { recursive: true }),
    ]);

    const slides = buildSlides(slideContents);
    await writeFile(join(sharedPath, "tokens.css"), renderTokensCss(mode), "utf8");
    await Promise.all(
      slides.map((slide, index) =>
        writeFile(
          join(deckPath, slide.file),
          renderSlideHtml({
            title,
            slide,
            content: slideContents[index]!,
            index,
            total: slides.length,
            mode,
          }),
          "utf8",
        ),
      ),
    );

    const manifest: StoredDeckManifest = {
      id,
      title,
      mode,
      path: deckPath,
      indexFile: join(deckPath, "index.html"),
      createdAt: now,
      updatedAt: now,
      slides,
    };
    await writeFile(manifest.indexFile, renderDeckIndex(slides), "utf8");
    await writeManifest(deckPath, manifest);

    return withPreviewUrl(manifest);
  }

  async createMockArtifact(artifactId: string): Promise<StudioDeckProject> {
    const artifactPath = await this.ensureArtifactWorkspace(artifactId);
    const now = Date.now();
    const manifest: StoredDeckManifest = {
      id: artifactId,
      title: "Mock Preview Artifact",
      mode: "freeform",
      path: artifactPath,
      indexFile: join(artifactPath, "index.html"),
      createdAt: now,
      updatedAt: now,
      slides: [
        {
          id: "mock-html",
          file: "index.html",
          label: "Mock HTML",
          title: "Mock Preview Artifact",
        },
      ],
    };

    await writeFile(manifest.indexFile, renderMockArtifactHtml(), "utf8");
    await writeManifest(artifactPath, manifest);
    return withPreviewUrl(manifest);
  }

  async readDeck(deckId: string): Promise<StudioDeckProject> {
    const deckPath = join(this.rootDir, safeDeckId(deckId));
    const raw = await readFile(join(deckPath, "deck.json"), "utf8");
    const manifest = JSON.parse(raw) as StoredDeckManifest;
    return withPreviewUrl(manifest);
  }

  async readArtifactDeck(artifactId: string): Promise<StudioDeckProject | undefined> {
    const artifactPath = this.getArtifactPath(artifactId);
    const indexFile = join(artifactPath, "index.html");
    try {
      await access(indexFile);
    } catch {
      return undefined;
    }

    const manifest = await readArtifactManifest(artifactPath, artifactId);
    return withPreviewUrl({
      ...manifest,
      path: artifactPath,
      indexFile,
    });
  }

  async openDeck(deckId: string): Promise<void> {
    const deck = (await this.readArtifactDeck(deckId)) ?? (await this.readDeck(deckId));
    await shell.openPath(deck.path);
  }

  async exportDeck(
    input: StudioExportDeckInput,
    parentWindow?: BrowserWindow,
  ): Promise<StudioExportDeckResult> {
    const deck = (await this.readArtifactDeck(input.deckId)) ?? (await this.readDeck(input.deckId));
    await validateDeck(deck);
    const outputDir = join(deck.path, "output");
    await mkdir(outputDir, { recursive: true });

    if (input.format === "html") {
      await shell.openPath(deck.path);
      return {
        format: "html",
        path: deck.path,
        message: "Opened the HTML deck folder. Use index.html as the presentation source.",
      };
    }

    if (input.format === "pdf") {
      const path = join(outputDir, `${slugify(deck.title)}.pdf`);
      await exportDeckPdf(deck, path, parentWindow);
      return {
        format: "pdf",
        path,
        message: "Exported a PDF snapshot from the HTML deck.",
      };
    }

    await validatePptxSafe(deck);
    const path = join(outputDir, `${slugify(deck.title)}-editable-pptx.md`);
    await writeFile(path, renderPptxReadme(deck), "utf8");
    return {
      format: "pptx",
      path,
      message:
        "Editable PPTX mode is scaffolded. This deck must stay in pptx-safe HTML before a PPTX translator is enabled.",
    };
  }
}

async function validateDeck(deck: StudioDeckProject): Promise<void> {
  if (!deck.indexFile.endsWith("index.html")) {
    throw new Error("Deck preview must use an index.html source file.");
  }

  try {
    await access(deck.indexFile);
  } catch {
    throw new Error("Deck is missing index.html. Ask the agent to write the HTML preview first.");
  }

  if (deck.slides.length === 0) {
    throw new Error("Deck has no discoverable slides.");
  }
}

async function validatePptxSafe(deck: StudioDeckProject): Promise<void> {
  if (deck.mode !== "pptx-safe") {
    throw new Error(
      "Editable PPTX export requires pptx-safe mode. Ask the agent to create a pptx-safe deck first.",
    );
  }

  const html = await readFile(deck.indexFile, "utf8");
  const banned = [
    ["linear-gradient", "CSS gradients are not PPTX-safe."],
    ["<deck-stage", "Web components are not PPTX-safe."],
    ["background-image", "Use <img> tags instead of CSS background-image."],
  ] as const;
  const violation = banned.find(([needle]) => html.includes(needle));
  if (violation) throw new Error(violation[1]);
}

async function readArtifactManifest(
  artifactPath: string,
  artifactId: string,
): Promise<StoredDeckManifest> {
  const deckJsonPath = join(artifactPath, "deck.json");
  try {
    const raw = await readFile(deckJsonPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredDeckManifest>;
    return {
      id: artifactId,
      title: parsed.title || titleFromArtifactId(artifactId),
      mode: parsed.mode === "pptx-safe" ? "pptx-safe" : "freeform",
      path: artifactPath,
      indexFile: join(artifactPath, "index.html"),
      createdAt: parsed.createdAt || Date.now(),
      updatedAt: Date.now(),
      slides: parsed.slides || (await discoverSlides(artifactPath)),
    };
  } catch {
    const stats = await discoverSlides(artifactPath);
    return {
      id: artifactId,
      title: titleFromArtifactId(artifactId),
      mode: "freeform",
      path: artifactPath,
      indexFile: join(artifactPath, "index.html"),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      slides: stats,
    };
  }
}

async function discoverSlides(artifactPath: string): Promise<StudioDeckSlide[]> {
  const slidesDir = join(artifactPath, "slides");
  try {
    const entries = await readdir(slidesDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .map((entry, index) => {
        const label = entry.name
          .replace(/\.html$/i, "")
          .replace(/^\d+-/, "")
          .replace(/-/g, " ");
        return {
          id: `slide-${String(index + 1).padStart(2, "0")}`,
          file: `slides/${entry.name}`,
          label,
          title: label,
        };
      });
  } catch {
    return [
      {
        id: "slide-01",
        file: "index.html",
        label: "Single page",
        title: "Single page",
      },
    ];
  }
}

function titleFromArtifactId(artifactId: string) {
  return artifactId
    .replace(/^artifact-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Studio deck";
}

async function exportDeckPdf(
  deck: StudioDeckProject,
  outputPath: string,
  parentWindow?: BrowserWindow,
) {
  const win = new BrowserWindow({
    width: DECK_WIDTH,
    height: DECK_HEIGHT,
    show: false,
    parent: parentWindow,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    await win.loadFile(deck.indexFile);
    await waitForDeckLoad(win);
    const data = await win.webContents.printToPDF({
      landscape: true,
      printBackground: true,
      margins: { marginType: "none" },
      pageSize: {
        width: 13.333,
        height: 7.5,
      },
    });
    await writeFile(outputPath, data);
  } finally {
    win.destroy();
  }
}

function waitForDeckLoad(win: BrowserWindow): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 900);
    win.webContents.once("did-frame-finish-load", () => setTimeout(resolve, 250));
  });
}

function buildSlides(contents: StudioDeckSlideContent[]): StudioDeckSlide[] {
  const labels = ["Cover", "Narrative", "Problem", "Solution", "Proof", "Roadmap", "Closing"];
  return contents.map((content, index) => {
    const n = String(index + 1).padStart(2, "0");
    const label = content.label?.trim() || labels[index] || `Slide ${index + 1}`;
    return {
      id: `slide-${n}`,
      file: `slides/${n}-${slugify(label)}.html`,
      label,
      title: content.title,
    };
  });
}

function renderDeckIndex(slides: StudioDeckSlide[]) {
  const manifest = slides
    .map((slide) => `    { file: ${JSON.stringify(slide.file)}, label: ${JSON.stringify(slide.label)} }`)
    .join(",\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Studio Deck</title>
<script>
  window.DECK_MANIFEST = [
${manifest}
  ];
  window.DECK_WIDTH = ${DECK_WIDTH};
  window.DECK_HEIGHT = ${DECK_HEIGHT};
</script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #0a0a0a; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  #stage { position: fixed; top: 0; left: 0; transform-origin: top left; width: ${DECK_WIDTH}px; height: ${DECK_HEIGHT}px; background: #fff; box-shadow: 0 10px 60px rgba(0,0,0,.4); }
  iframe { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
  .counter { position: fixed; right: 20px; bottom: 20px; z-index: 10; border-radius: 999px; background: rgba(0,0,0,.65); color: #fff; padding: 6px 14px; font-size: 13px; opacity: .72; }
  .counter .label { color: rgba(255,255,255,.72); margin-left: 8px; }
  .nav-zone { position: fixed; top: 0; bottom: 0; width: 15%; z-index: 5; cursor: pointer; }
  .nav-zone.left { left: 0; }
  .nav-zone.right { right: 0; }
  @media print {
    @page { size: 1920px 1080px; margin: 0; }
    html, body { background: #fff; overflow: visible; height: auto; }
    #stage, .counter, .nav-zone { display: none !important; }
    .print-stack { display: block !important; }
    .print-stack iframe { width: 1920px; height: 1080px; page-break-after: always; display: block; }
  }
</style>
</head>
<body>
<div id="stage"><iframe id="frame" src="about:blank"></iframe></div>
<div class="nav-zone left" id="navL"></div>
<div class="nav-zone right" id="navR"></div>
<div class="counter" id="counter">1 / 1</div>
<div class="print-stack" id="printStack" style="display:none"></div>
<script>
(() => {
  const W = window.DECK_WIDTH || 1920;
  const H = window.DECK_HEIGHT || 1080;
  const deck = window.DECK_MANIFEST || [];
  const stage = document.getElementById("stage");
  const frame = document.getElementById("frame");
  const counter = document.getElementById("counter");
  const printStack = document.getElementById("printStack");
  const storageKey = "studio-deck-" + location.pathname;
  let current = 0;
  function fit() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = \`translate(\${(window.innerWidth - W * s) / 2}px, \${(window.innerHeight - H * s) / 2}px) scale(\${s})\`;
  }
  function show(idx) {
    if (idx < 0 || idx >= deck.length) return;
    current = idx;
    frame.src = deck[idx].file;
    counter.innerHTML = \`\${idx + 1} / \${deck.length}<span class="label">\${deck[idx].label || ""}</span>\`;
    try { localStorage.setItem(storageKey, String(idx)); } catch (_) {}
    if (location.hash !== "#" + (idx + 1)) history.replaceState(null, "", "#" + (idx + 1));
  }
  function next() { show(Math.min(current + 1, deck.length - 1)); }
  function prev() { show(Math.max(current - 1, 0)); }
  document.addEventListener("keydown", (e) => {
    if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); next(); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
    if (e.key === "Home") { e.preventDefault(); show(0); }
    if (e.key === "End") { e.preventDefault(); show(deck.length - 1); }
    if (e.key === "p" || e.key === "P") window.print();
  });
  document.getElementById("navL").addEventListener("click", prev);
  document.getElementById("navR").addEventListener("click", next);
  window.addEventListener("resize", fit);
  window.addEventListener("hashchange", () => {
    const match = location.hash.match(/^#(\\d+)$/);
    if (match) show(Number(match[1]) - 1);
  });
  window.addEventListener("beforeprint", () => {
    printStack.innerHTML = "";
    deck.forEach((item) => {
      const iframe = document.createElement("iframe");
      iframe.src = item.file;
      printStack.appendChild(iframe);
    });
  });
  const hash = location.hash.match(/^#(\\d+)$/);
  if (hash) current = Math.max(0, Math.min(Number(hash[1]) - 1, deck.length - 1));
  else {
    const stored = Number(localStorage.getItem(storageKey));
    if (Number.isInteger(stored) && stored >= 0 && stored < deck.length) current = stored;
  }
  fit();
  show(current);
})();
</script>
</body>
</html>
`;
}

function renderMockArtifactHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Studio Mock Preview</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    display: grid;
    place-items: center;
    min-height: 100vh;
    background:
      radial-gradient(circle at 20% 10%, rgba(132, 204, 22, 0.28), transparent 32%),
      radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.24), transparent 30%),
      #09090b;
    color: white;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  main {
    width: min(780px, calc(100vw - 48px));
    border: 1px solid rgba(255,255,255,.16);
    border-radius: 28px;
    padding: 42px;
    background: rgba(255,255,255,.08);
    box-shadow: 0 28px 90px rgba(0,0,0,.42);
    backdrop-filter: blur(18px);
  }
  p { margin: 0; color: rgba(255,255,255,.72); font-size: 18px; line-height: 1.6; }
  .eyebrow { margin-bottom: 16px; color: #bef264; font-size: 13px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
  h1 { margin: 0 0 18px; font-size: clamp(48px, 8vw, 92px); line-height: .92; letter-spacing: -.06em; }
  .badge { display: inline-flex; margin-top: 28px; border-radius: 999px; background: rgba(255,255,255,.12); padding: 10px 14px; color: white; font-size: 14px; }
</style>
</head>
<body>
  <main>
    <p class="eyebrow">Studio preview protocol test</p>
    <h1>Mock HTML artifact loaded.</h1>
    <p>
      This file was written into the current Studio artifact workspace and is served through
      <code>studio-artifact://</code>, the same preview path used for Pi-generated HTML.
    </p>
    <div class="badge">If you can read this, iframe preview works.</div>
  </main>
</body>
</html>
`;
}

function renderSlideHtml({
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
<meta name="viewport" content="width=1920,height=1080">
<title>${escapeHtml(title)} · ${escapeHtml(slide.label)}</title>
<link rel="stylesheet" href="../shared/tokens.css">
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

function renderTokensCss(mode: StudioDeckMode) {
  const background =
    mode === "pptx-safe"
      ? "#faf8f1"
      : "radial-gradient(circle at 20% 0%, rgba(215,255,114,.18), transparent 30%), #faf8f1";
  return `* { box-sizing: border-box; }
html, body { margin: 0; width: ${DECK_WIDTH}px; height: ${DECK_HEIGHT}px; overflow: hidden; }
body { background: ${background}; color: #171714; font-family: Georgia, "Times New Roman", serif; }
.slide { position: relative; width: ${DECK_WIDTH}px; height: ${DECK_HEIGHT}px; padding: 58px 76px 64px; }
.masthead { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(23,23,20,.18); padding-bottom: 18px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: .12em; text-transform: uppercase; font-size: 16px; color: rgba(23,23,20,.55); }
.content { height: calc(100% - 50px); display: flex; flex-direction: column; justify-content: center; gap: 28px; }
.kicker { width: fit-content; border: 1px solid rgba(23,23,20,.2); border-radius: 999px; padding: 8px 14px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 15px; letter-spacing: .16em; text-transform: uppercase; }
h1 { max-width: 1240px; margin: 0; font-size: 118px; line-height: .95; letter-spacing: -.055em; text-wrap: balance; }
.cover h1 { max-width: 1500px; font-size: 150px; }
.lede { max-width: 980px; margin: 0; font-size: 30px; line-height: 1.35; color: rgba(23,23,20,.72); text-wrap: pretty; }
.process { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; max-width: 1440px; margin-top: 12px; }
article { border-top: 1px solid rgba(23,23,20,.18); padding-top: 22px; }
.eyebrow { margin: 0 0 14px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; letter-spacing: .14em; text-transform: uppercase; color: rgba(23,23,20,.5); }
h2 { margin: 0 0 12px; font-size: 36px; letter-spacing: -.02em; }
article p:last-child { margin: 0; max-width: 520px; font-size: 22px; line-height: 1.55; color: rgba(23,23,20,.68); }
`;
}

function normalizeSlideContents(input: StudioCreateDeckInput): StudioDeckSlideContent[] {
  const provided = input.slides
    ?.filter((slide) => slide.title.trim().length > 0)
    .slice(0, 12);

  if (provided && provided.length > 0) return provided;

  const count = clampSlideCount(input.slideCount ?? 5);
  const labels = ["Cover", "Narrative", "Problem", "Solution", "Proof", "Roadmap", "Closing"];
  return Array.from({ length: count }, (_, index) => ({
    label: labels[index] ?? `Slide ${index + 1}`,
    title: index === 0 ? sanitizeTitle(input.title || "Untitled launch deck") : labels[index] ?? `Slide ${index + 1}`,
    lede:
      index === 0
        ? "A browser-ready HTML deck generated by Studio."
        : "Replace this placeholder with one focused message.",
  }));
}

function renderPptxReadme(deck: StudioDeckProject) {
  return `# Editable PPTX Export Notes

Deck: ${deck.title}
Mode: ${deck.mode}

Studio has generated the HTML source deck at:
${deck.path}

Editable PPTX export must be authored in \`pptx-safe\` mode from the first slide. The required constraints are:

1. Fixed wide layout: 960pt x 540pt equivalent.
2. All editable text lives in \`p\` or heading tags.
3. Text tags do not carry background, border, or shadow styling.
4. Images are real \`img\` elements, not CSS background images.
5. Avoid gradients, web components, and complex SVG decorations.

This file is a placeholder for the PPTX translator pass. Use the HTML deck or PDF export for presentation-ready output now.
`;
}

async function writeManifest(deckPath: string, manifest: StoredDeckManifest) {
  await writeFile(join(deckPath, "deck.json"), JSON.stringify(manifest, null, 2), "utf8");
}

function withPreviewUrl(manifest: StoredDeckManifest): StudioDeckProject {
  return {
    ...manifest,
    previewUrl: `studio-artifact://artifacts/${encodeURIComponent(manifest.id)}/index.html`,
  };
}

function sanitizeTitle(title: string) {
  const trimmed = title.trim();
  return trimmed || "Untitled launch deck";
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

function clampSlideCount(value: number) {
  if (!Number.isFinite(value)) return 5;
  return Math.max(2, Math.min(12, Math.round(value)));
}

function safeDeckId(deckId: string) {
  if (!/^[a-z0-9-]+$/i.test(deckId)) {
    throw new Error("Invalid deck id.");
  }
  return deckId;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
