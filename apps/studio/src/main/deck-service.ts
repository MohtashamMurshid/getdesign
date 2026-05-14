import { BrowserWindow, shell } from "electron";
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";

import type {
  StudioArtifactKind,
  StudioCreateDeckInput,
  StudioDeckMode,
  StudioDeckPlan,
  StudioDeckPlanInput,
  StudioDeckProject,
  StudioDeckSlide,
  StudioDeckSlideContent,
  StudioDeckTweaks,
  StudioDeckVerificationIssue,
  StudioDeckVerificationResult,
  StudioExportDeckInput,
  StudioExportDeckResult,
} from "../shared/studio-api";
import { findDeckTemplate, listDeckTemplates } from "./deck-templates";
import {
  exportStudioDeckPptx,
  validateStudioPptxDeck,
} from "./studio-pptx-export";
import { waitForWebContentsVisualReady } from "./web-contents-ready";
import {
  buildSlides,
  getDeckDimensionsForMode,
  renderSlideHtml,
  renderTokensCss,
} from "./deck-template-rendering";

const DEFAULT_DECK_DIMENSIONS = getDeckDimensionsForMode("freeform");
const TEMP_INDEX_MARKER = "studio-generated-temporary-index";
const DECK_PLAN_FILE = "deck-plan.json";
const VALID_EXPORT_PATHS = new Set(["html", "html-pdf", "pptx"]);
const VALID_PLAN_STATUSES = new Set(["pending", "confirmed"]);
const VALID_THEMES = new Set(["default", "light", "dark", "warm", "cool"]);
const VALID_DENSITIES = new Set(["comfortable", "compact", "spacious"]);
const VALID_IMAGE_STYLES = new Set(["default", "muted", "vivid"]);

type StoredDeckManifest = Omit<StudioDeckProject, "previewUrl">;
type DeckDimensions = { width: number; height: number };

export { listDeckTemplates };

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
        .map((entry) => this.readArtifactDeck(entry.name).catch(() => undefined)),
    );
    return decks
      .filter((deck): deck is StudioDeckProject => Boolean(deck))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async createDeck(input: StudioCreateDeckInput = {}): Promise<StudioDeckProject> {
    await mkdir(this.rootDir, { recursive: true });
    const template = input.templateId ? findDeckTemplate(input.templateId) : undefined;
    if (input.templateId && !template) {
      throw new Error(`Unknown deck template: ${input.templateId}`);
    }
    const now = Date.now();
    const title = sanitizeTitle(input.title || template?.title || "Untitled launch deck");
    const id = `${slugify(title)}-${now.toString(36)}`;
    const mode = input.mode ?? template?.mode ?? "freeform";
    const slideContents = normalizeSlideContents(
      template ? { ...input, slides: template.slides } : input,
    );
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
    await writeTweaksCss(deckPath, {});
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
      artifactKind: "deck",
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

  async createDeckFromTemplate(input: {
    templateId: string;
    title?: string;
  }): Promise<StudioDeckProject> {
    return this.createDeck({ templateId: input.templateId, title: input.title });
  }

  async readDeck(deckId: string): Promise<StudioDeckProject> {
    const deckPath = join(this.rootDir, safeDeckId(deckId));
    const raw = await readFile(join(deckPath, "deck.json"), "utf8");
    const manifest = JSON.parse(raw) as StoredDeckManifest;
    const plan = await readPlanFile(deckPath);
    return withPreviewUrl({ ...manifest, plan });
  }

  async readArtifactDeck(artifactId: string): Promise<StudioDeckProject | undefined> {
    const artifactPath = this.getArtifactPath(artifactId);
    const indexFile = join(artifactPath, "index.html");
    const slides = await discoverSlides(artifactPath);
    const hasSlideFiles = slides.some((slide) => slide.file.startsWith("slides/"));
    const plan = await readPlanFile(artifactPath);

    if (!hasSlideFiles) {
      const stored = await readStoredManifest(artifactPath);
      const hasIndexFile = await pathExists(indexFile);
      if (!plan && !stored && !hasIndexFile) return undefined;
      const now = Date.now();
      const manifest = await readArtifactManifest(artifactPath, artifactId, {
        parsed: stored,
        discoveredSlides: slides,
      });
      return withPreviewUrl({
        ...manifest,
        artifactKind: inferArtifactKind({
          parsed: stored,
          plan,
          hasSlideFiles,
          hasIndexFile,
          artifactPath,
        }),
        mode: plan?.mode ?? manifest.mode,
        path: artifactPath,
        indexFile,
        createdAt: manifest.createdAt || plan?.createdAt || now,
        updatedAt: Math.max(manifest.updatedAt || 0, now),
        slides: stored || hasIndexFile ? manifest.slides : [],
        plan,
        tweaks: manifest.tweaks,
      });
    }

    const dimensions = await inferDeckDimensions(artifactPath, slides);
    // Studio owns index.html. Always regenerate from the slide list so that:
    //   1. the preview iframe shows a real slide runner (scaled stage,
    //      keyboard nav) instead of whatever shell the agent invented,
    //   2. PDF export's printToPDF prints the actual slides via the print
    //      stack rather than e.g. a card grid the agent wrote, and
    //   3. adding/removing a slide file is reflected in the runner without
    //      the agent having to touch index.html.
    // Agents are instructed via STUDIO_SYSTEM_PROMPT to write slides/*.html
    // only — but we enforce here so a misbehaving (or older) agent run can't
    // leave a broken index.html on disk.
    const nextIndexHtml = renderDeckIndex(slides, dimensions);
    let indexUpdatedAt = 0;
    try {
      const existingHtml = await readFile(indexFile, "utf8");
      if (existingHtml === nextIndexHtml) {
        indexUpdatedAt = (await stat(indexFile)).mtimeMs;
      } else {
        await writeFile(indexFile, nextIndexHtml, "utf8");
        indexUpdatedAt = Date.now();
      }
    } catch {
      await writeFile(indexFile, nextIndexHtml, "utf8");
      indexUpdatedAt = Date.now();
    }

    const manifest = await readArtifactManifest(artifactPath, artifactId);
    // Plan is the source of truth for `mode` until the agent (or applyDeckTweaks)
    // writes a deck.json. Without this fallback, decks built without a manifest
    // always reported `freeform` and the PPTX export button stayed disabled
    // even when deck-plan.json explicitly said `pptx-safe`.
    const effectiveMode = plan?.mode ?? manifest.mode;
    return withPreviewUrl({
      ...manifest,
      artifactKind: inferArtifactKind({
        parsed: await readStoredManifest(artifactPath),
        plan,
        hasSlideFiles,
        hasIndexFile: true,
        artifactPath,
      }),
      mode: effectiveMode,
      path: artifactPath,
      indexFile,
      updatedAt: Math.max(manifest.updatedAt, indexUpdatedAt),
      plan,
    });
  }

  async openDeck(deckId: string): Promise<void> {
    const deck = (await this.readArtifactDeck(deckId)) ?? (await this.readDeck(deckId));
    await shell.openPath(deck.path);
  }

  async loadDeck(deckId: string): Promise<StudioDeckProject> {
    return (
      (await this.readArtifactDeck(deckId)) ?? (await this.readDeck(deckId))
    );
  }

  async saveDeckPlan(
    deckId: string,
    planInput: StudioDeckPlanInput,
  ): Promise<StudioDeckProject> {
    const deck = await this.loadDeck(deckId);
    const existing = await readPlanFile(deck.path);
    const sanitized = sanitizePlanInput(planInput);
    const plan: StudioDeckPlan = {
      ...sanitized,
      status: "pending",
      createdAt: existing?.createdAt ?? Date.now(),
      confirmedAt: undefined,
    };
    await writePlanFile(deck.path, plan);
    return this.loadDeck(deckId);
  }

  async confirmDeckPlan(deckId: string): Promise<StudioDeckProject> {
    const deck = await this.loadDeck(deckId);
    const existing = await readPlanFile(deck.path);
    if (!existing) {
      throw new Error(
        "No deck plan found. Ask the agent to write deck-plan.json first, then confirm.",
      );
    }
    const next: StudioDeckPlan = {
      ...existing,
      status: "confirmed",
      confirmedAt: Date.now(),
    };
    await writePlanFile(deck.path, next);
    return this.loadDeck(deckId);
  }

  async applyDeckTweaks(
    deckId: string,
    tweaks: StudioDeckTweaks,
  ): Promise<StudioDeckProject> {
    const deck = await this.loadDeck(deckId);
    const sanitized = sanitizeTweaks(tweaks);
    const manifestPath = join(deck.path, "deck.json");
    let stored: Partial<StoredDeckManifest> = {};
    try {
      stored = JSON.parse(await readFile(manifestPath, "utf8")) as Partial<StoredDeckManifest>;
    } catch {
      // Artifact-style decks may not have a deck.json yet; we'll create one.
    }
    const next: StoredDeckManifest = {
      id: deck.id,
      artifactKind: deck.artifactKind,
      title: stored.title ?? deck.title,
      mode: stored.mode ?? deck.mode,
      path: deck.path,
      indexFile: deck.indexFile,
      createdAt: stored.createdAt ?? deck.createdAt,
      updatedAt: Date.now(),
      slides: deck.slides,
      tweaks: sanitized,
    };
    await writeManifest(deck.path, next);
    await writeTweaksCss(deck.path, sanitized);
    return this.loadDeck(deckId);
  }

  async verifyDeck(deckId: string): Promise<StudioDeckVerificationResult> {
    const deck = await this.loadDeck(deckId);
    return verifyDeckArtifact(deck);
  }

  async exportDeck(
    input: StudioExportDeckInput,
    parentWindow?: BrowserWindow,
  ): Promise<StudioExportDeckResult> {
    const deck = await this.loadDeck(input.deckId);
    await validateDeck(deck);
    requireConfirmedPlan(deck);
    // Only enforce pptx-safe authoring rules when the user is actually exporting
    // pptx. PDF and the "open HTML folder" path don't care about <p>-with-border
    // or 16:9 body sizing.
    const enforcePptxSafe = input.format === "pptx" && deck.mode === "pptx-safe";
    const verification = await verifyDeckArtifact(deck, { enforcePptxSafe });
    const blockingErrors = verification.issues.filter((issue) => issue.level === "error");
    if (blockingErrors.length > 0) {
      throw new Error(
        `Deck verification failed:\n${blockingErrors
          .map((issue) => `${issue.slide ? `${issue.slide}: ` : ""}${issue.message}`)
          .join("\n")}`,
      );
    }
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

    const path = join(outputDir, `${slugify(deck.title)}.pptx`);
    await exportStudioDeckPptx(deck, path, parentWindow);
    return {
      format: "pptx",
      path,
      message: "Exported an editable PPTX from the Studio HTML deck.",
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

/**
 * Static substring bans for pptx-safe mode. The renderer-side
 * `validateStudioPptxDeck` catches the same violations via computed style, but
 * substring bans add a fast pre-check that catches content the headless render
 * may strip (commented-out templates, web component definitions, etc.). Kept in
 * sync with the documented four pptx-safe rules.
 */
const PPTX_SAFE_BANNED_SUBSTRINGS: ReadonlyArray<readonly [string, string]> = [
  ["linear-gradient", "CSS gradients are not PPTX-safe."],
  ["<deck-stage", "Web components are not PPTX-safe."],
  ["background-image", "Use <img> tags instead of CSS background-image."],
];

async function readArtifactManifest(
  artifactPath: string,
  artifactId: string,
  options: {
    parsed?: Partial<StoredDeckManifest>;
    discoveredSlides?: StudioDeckSlide[];
  } = {},
): Promise<StoredDeckManifest> {
  const parsed = options.parsed ?? (await readStoredManifest(artifactPath)) ?? {};

  const discovered = options.discoveredSlides ?? (await discoverSlides(artifactPath));
  const discoveredHasSlideFiles = discovered.some((slide) => slide.file.startsWith("slides/"));
  const baseSlides = discoveredHasSlideFiles
    ? mergeDiscoveredSlideMetadata(discovered, parsed.slides)
    : parsed.slides && parsed.slides.length > 0
      ? parsed.slides
      : discovered;
  const slides = await hydrateSlideNotes(artifactPath, baseSlides);

  return {
    id: artifactId,
    artifactKind: normalizeArtifactKind(parsed.artifactKind),
    title: parsed.title || titleFromArtifactId(artifactId),
    mode: parsed.mode === "pptx-safe" ? "pptx-safe" : "freeform",
    path: artifactPath,
    indexFile: join(artifactPath, "index.html"),
    createdAt: parsed.createdAt || Date.now(),
    updatedAt: Date.now(),
    slides,
    tweaks: sanitizeTweaks(parsed.tweaks ?? {}),
  };
}

async function readStoredManifest(
  artifactPath: string,
): Promise<Partial<StoredDeckManifest> | undefined> {
  try {
    const raw = await readFile(join(artifactPath, "deck.json"), "utf8");
    return JSON.parse(raw) as Partial<StoredDeckManifest>;
  } catch {
    return undefined;
  }
}

function mergeDiscoveredSlideMetadata(
  discovered: StudioDeckSlide[],
  stored: StudioDeckSlide[] | undefined,
): StudioDeckSlide[] {
  if (!stored || stored.length === 0) return discovered;
  return discovered.map((slide) => {
    const previous = stored.find(
      (candidate) => candidate.file === slide.file || candidate.id === slide.id,
    );
    return previous?.notes ? { ...slide, notes: previous.notes } : slide;
  });
}

async function discoverSlides(artifactPath: string): Promise<StudioDeckSlide[]> {
  const slidesDir = join(artifactPath, "slides");
  try {
    const entries = await readdir(slidesDir, { withFileTypes: true });
    const html = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .map((entry) => entry.name)
      .sort(naturalCompare);
    if (html.length === 0) {
      return fallbackSingleSlide();
    }
    return html.map((name, index) => {
      const label = name
        .replace(/\.html$/i, "")
        .replace(/^\d+[-_]?/, "")
        .replace(/[-_]/g, " ")
        .trim() || `Slide ${index + 1}`;
      return {
        id: `slide-${String(index + 1).padStart(2, "0")}`,
        file: `slides/${name}`,
        label,
        title: label,
      };
    });
  } catch {
    return fallbackSingleSlide();
  }
}

function fallbackSingleSlide(): StudioDeckSlide[] {
  return [
    {
      id: "slide-01",
      file: "index.html",
      label: "Single page",
      title: "Single page",
    },
  ];
}

/** Order strings the way humans read slide files: 01, 02, ... 10. */
function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Manifest-level notes are the source of truth. If a slide has no notes
 * recorded yet, look for `<aside class="notes" hidden>...</aside>` inside the
 * slide HTML so authors can write notes inline without re-editing deck.json.
 */
async function hydrateSlideNotes(
  artifactPath: string,
  slides: StudioDeckSlide[],
): Promise<StudioDeckSlide[]> {
  return Promise.all(
    slides.map(async (slide) => {
      if (slide.notes && slide.notes.trim().length > 0) return slide;
      if (!slide.file.startsWith("slides/")) return slide;
      try {
        const html = await readFile(join(artifactPath, slide.file), "utf8");
        const imported = extractAsideNotes(html);
        if (imported) return { ...slide, notes: imported };
      } catch {
        // Missing slide files surface in verifyDeck instead.
      }
      return slide;
    }),
  );
}

function extractAsideNotes(html: string): string | undefined {
  const match = html.match(
    /<aside\b[^>]*class=["'][^"']*\bnotes\b[^"']*["'][^>]*>([\s\S]*?)<\/aside>/i,
  );
  if (!match) return undefined;
  const text = match[1]!
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : undefined;
}

function titleFromArtifactId(artifactId: string) {
  return artifactId
    .replace(/^artifact-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Studio deck";
}

async function inferDeckDimensions(
  artifactPath: string,
  slides: StudioDeckSlide[],
): Promise<DeckDimensions> {
  const firstSlide = slides.find((slide) => slide.file.startsWith("slides/"));
  if (!firstSlide) {
    return (await inferSharedStylesDimensions(artifactPath)) ?? DEFAULT_DECK_DIMENSIONS;
  }

  try {
    const html = await readFile(join(artifactPath, firstSlide.file), "utf8");
    const fromSlide =
      readCssDimensions(html, /\.slide\s*\{([\s\S]*?)\}/i) ??
      readCssDimensions(html, /body\s*\{([\s\S]*?)\}/i) ??
      readViewportDimensions(html);
    if (fromSlide) return fromSlide;
    return (await inferSharedStylesDimensions(artifactPath)) ?? DEFAULT_DECK_DIMENSIONS;
  } catch {
    return (await inferSharedStylesDimensions(artifactPath)) ?? DEFAULT_DECK_DIMENSIONS;
  }
}

/**
 * Many decks define `.slide { width/height }` in shared/tokens.css rather than
 * each slide file. If we only inspect slide HTML we fall back to 1920x1080,
 * which shrinks preview scale and can produce mismatched PDF sizing.
 */
async function inferSharedStylesDimensions(
  artifactPath: string,
): Promise<DeckDimensions | undefined> {
  const candidates = [join(artifactPath, "shared", "tokens.css"), join(artifactPath, "shared", "tweaks.css")];
  for (const path of candidates) {
    try {
      const css = await readFile(path, "utf8");
      const fromSlideClass = readCssDimensions(css, /\.slide\s*\{([\s\S]*?)\}/i);
      if (fromSlideClass) return fromSlideClass;
      const fromBody = readCssDimensions(css, /body\s*\{([\s\S]*?)\}/i);
      if (fromBody) return fromBody;
    } catch {
      // Optional file.
    }
  }
  return undefined;
}

function readCssDimensions(html: string, blockPattern: RegExp): DeckDimensions | undefined {
  const block = html.match(blockPattern)?.[1];
  if (!block) return undefined;
  const width = readCssLengthValue(html, block, "width");
  const height = readCssLengthValue(html, block, "height");
  return width && height ? { width, height } : undefined;
}

function readViewportDimensions(html: string): DeckDimensions | undefined {
  const content = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (!content) return undefined;
  const width = readViewportValue(content, "width");
  const height = readViewportValue(content, "height");
  return width && height ? { width, height } : undefined;
}

function readPixelValue(css: string, property: string): number | undefined {
  const match = css.match(new RegExp(`${property}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`, "i"));
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function readCssLengthValue(
  fullSource: string,
  blockSource: string,
  property: string,
): number | undefined {
  const px = readPixelValue(blockSource, property);
  if (px) return px;
  const varMatch = blockSource.match(new RegExp(`${property}\\s*:\\s*var\\((--[\\w-]+)\\)`, "i"));
  if (!varMatch) return undefined;
  return readCssVariablePixelValue(fullSource, varMatch[1]!);
}

function readCssVariablePixelValue(source: string, variableName: string): number | undefined {
  const match = source.match(
    new RegExp(`${escapeRegExp(variableName)}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`, "i"),
  );
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readViewportValue(content: string, property: string): number | undefined {
  const match = content.match(new RegExp(`${property}\\s*=\\s*(\\d+(?:\\.\\d+)?)`, "i"));
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

async function exportDeckPdf(
  deck: StudioDeckProject,
  outputPath: string,
  parentWindow?: BrowserWindow,
) {
  const dimensions = await inferDeckDimensions(deck.path, deck.slides);
  const win = new BrowserWindow({
    // Match the BrowserWindow viewport to deck dimensions so the runner's
    // fit() call doesn't downscale the stage in the headless window.
    width: dimensions.width,
    height: dimensions.height,
    useContentSize: true,
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
    await waitForPrintFramesReady(win);
    // Electron's printToPDF expects pageSize in MICRONS (not inches), and
    // silently ignores non-integer values (electron/electron#9361). Passing
    // `{ width: 13.333, height: 7.5 }` made Chromium fall back to the default
    // Letter portrait page, which is why exported PDFs came out portrait with
    // 16:9 slides clipped on the side.
    //
    // We map deck CSS pixels → microns at the standard CSS DPI of 96, so a
    // 1280×720 deck prints exactly 1280×720 CSS px landscape with no scaling.
    const pageSize = pxToMicronPageSize(dimensions);
    const data = await win.webContents.printToPDF({
      // Orientation comes from width > height. `landscape: true` would swap
      // the page dimensions on top of our explicit pageSize and re-introduce
      // the same clipping bug.
      landscape: false,
      printBackground: true,
      margins: { marginType: "none" },
      pageSize,
    });
    await writeFile(outputPath, data);
  } finally {
    win.destroy();
  }
}

/** CSS px → microns at 96 DPI (1in = 25400µm, 1in = 96 CSS px). Integers
 * required because Electron drops floats silently. */
function pxToMicronPageSize(dimensions: DeckDimensions): {
  width: number;
  height: number;
} {
  const MICRONS_PER_INCH = 25400;
  const CSS_DPI = 96;
  const toMicrons = (px: number) => Math.round((px / CSS_DPI) * MICRONS_PER_INCH);
  return {
    width: toMicrons(dimensions.width),
    height: toMicrons(dimensions.height),
  };
}

/**
 * Ensure the runner's print-stack iframes are loaded before Chromium snapshots
 * print layout. Without this, printToPDF can race and output blank/white pages
 * when the stack is still loading.
 */
async function waitForPrintFramesReady(win: BrowserWindow): Promise<void> {
  await win.webContents.executeJavaScript(
    `(async () => {
      function waitFrame(frame) {
        return new Promise((resolve) => {
          if (!frame) return resolve();
          const done = () => resolve();
          try {
            const doc = frame.contentDocument;
            if (doc && doc.readyState === "complete") return resolve();
          } catch (_) {}
          frame.addEventListener("load", done, { once: true });
          frame.addEventListener("error", done, { once: true });
          setTimeout(done, 1200);
        });
      }
      const active = document.getElementById("frame");
      const printFrames = Array.from(document.querySelectorAll("#printStack iframe"));
      await Promise.all([waitFrame(active), ...printFrames.map(waitFrame)]);
      return true;
    })()`,
  );
}

/**
 * Wait for the page to be visually ready instead of using a fixed 900ms timer:
 *   1. did-finish-load fires when the main frame finishes loading.
 *   2. document.fonts.ready resolves when web fonts are available.
 *   3. Two requestAnimationFrame ticks let the layout settle.
 * Falls back to a 1500ms ceiling so a hung page never wedges export forever.
 */
function waitForDeckLoad(win: BrowserWindow): Promise<void> {
  return waitForWebContentsVisualReady(win.webContents, 1500);
}

function renderDeckIndex(
  slides: StudioDeckSlide[],
  dimensions: DeckDimensions = DEFAULT_DECK_DIMENSIONS,
) {
  const manifest = slides
    .map((slide) => `    { file: ${JSON.stringify(slide.file)}, label: ${JSON.stringify(slide.label)} }`)
    .join(",\n");
  const printFrames = slides
    .map((slide) => `  <iframe src=${JSON.stringify(slide.file)} loading="eager"></iframe>`)
    .join("\n");
  const deckWidth = dimensions.width;
  const deckHeight = dimensions.height;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Studio Deck</title>
<meta name="${TEMP_INDEX_MARKER}" content="true">
<script>
  window.DECK_MANIFEST = [
${manifest}
  ];
  window.DECK_WIDTH = ${deckWidth};
  window.DECK_HEIGHT = ${deckHeight};
</script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #0a0a0a; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  #stage { position: fixed; top: 0; left: 0; transform-origin: top left; width: ${deckWidth}px; height: ${deckHeight}px; background: #fff; box-shadow: 0 10px 60px rgba(0,0,0,.4); }
  iframe { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
  .counter { position: fixed; right: 20px; bottom: 20px; z-index: 10; border-radius: 999px; background: rgba(0,0,0,.65); color: #fff; padding: 6px 14px; font-size: 13px; opacity: .72; }
  .counter .label { color: rgba(255,255,255,.72); margin-left: 8px; }
  .nav-zone { position: fixed; top: 0; bottom: 0; width: 15%; z-index: 5; cursor: pointer; }
  .nav-zone.left { left: 0; }
  .nav-zone.right { right: 0; }
  .nav-btn {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    z-index: 11;
    width: 36px;
    height: 36px;
    border: 1px solid rgba(255,255,255,.25);
    border-radius: 999px;
    background: rgba(0,0,0,.55);
    color: #fff;
    font-size: 22px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: .86;
  }
  .nav-btn:hover { background: rgba(0,0,0,.75); opacity: 1; }
  .nav-btn.left { left: 14px; }
  .nav-btn.right { right: 14px; }
  .nav-btn:disabled { opacity: .28; cursor: default; }
  @media print {
    @page { size: ${deckWidth}px ${deckHeight}px; margin: 0; }
    html, body { background: #fff; overflow: visible; height: auto; }
    #stage, .counter, .nav-zone, .nav-btn { display: none !important; }
    .print-stack { display: block !important; }
    .print-stack iframe { width: ${deckWidth}px; height: ${deckHeight}px; page-break-after: always; display: block; }
  }
</style>
</head>
<body>
<div id="stage"><iframe id="frame" src="about:blank"></iframe></div>
<div class="nav-zone left" id="navL"></div>
<div class="nav-zone right" id="navR"></div>
<button class="nav-btn left" id="navPrev" aria-label="Previous slide" title="Previous slide">‹</button>
<button class="nav-btn right" id="navNext" aria-label="Next slide" title="Next slide">›</button>
<div class="counter" id="counter">1 / 1</div>
<div class="print-stack" id="printStack" style="display:none">
${printFrames}
</div>
<script>
(() => {
  const W = window.DECK_WIDTH || 1920;
  const H = window.DECK_HEIGHT || 1080;
  const deck = window.DECK_MANIFEST || [];
  const stage = document.getElementById("stage");
  const frame = document.getElementById("frame");
  const counter = document.getElementById("counter");
  const navPrev = document.getElementById("navPrev");
  const navNext = document.getElementById("navNext");
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
    if (navPrev) navPrev.disabled = idx <= 0;
    if (navNext) navNext.disabled = idx >= deck.length - 1;
  }
  function next() { show(Math.min(current + 1, deck.length - 1)); }
  function prev() { show(Math.max(current - 1, 0)); }
  document.addEventListener("keydown", (e) => {
    if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); next(); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
    if (e.key === "Home") { e.preventDefault(); show(0); }
    if (e.key === "End") { e.preventDefault(); show(deck.length - 1); }
    if (e.key === "p" || e.key === "P") window.print();
    if (/^[1-9]$/.test(e.key)) {
      const index = Number(e.key) - 1;
      if (index < deck.length) { e.preventDefault(); show(index); }
    }
  });
  document.getElementById("navL").addEventListener("click", prev);
  document.getElementById("navR").addEventListener("click", next);
  if (navPrev) navPrev.addEventListener("click", prev);
  if (navNext) navNext.addEventListener("click", next);
  window.addEventListener("resize", fit);
  // Always open from slide 1 on load so switching chat history/decks doesn't
  // restore stale position from hash/localStorage.
  current = 0;
  fit();
  show(current);
})();
</script>
</body>
</html>
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

async function writeManifest(deckPath: string, manifest: StoredDeckManifest) {
  await writeFile(join(deckPath, "deck.json"), JSON.stringify(manifest, null, 2), "utf8");
}

function withPreviewUrl(manifest: StoredDeckManifest): StudioDeckProject {
  return {
    ...manifest,
    artifactKind: normalizeArtifactKind(manifest.artifactKind),
    previewUrl: `studio-artifact://artifacts/${encodeURIComponent(manifest.id)}/index.html`,
  };
}

function inferArtifactKind(input: {
  parsed?: Partial<StoredDeckManifest>;
  plan?: StudioDeckPlan;
  hasSlideFiles: boolean;
  hasIndexFile: boolean;
  artifactPath: string;
}): StudioArtifactKind {
  const explicit = normalizeArtifactKind(input.parsed?.artifactKind);
  if (explicit !== "deck") return explicit;
  if (input.plan || input.hasSlideFiles) return "deck";

  const title = `${input.parsed?.title ?? ""} ${input.artifactPath}`.toLowerCase();
  if (/\b(proto|prototype|ios|android|app|mockup)\b/.test(title)) return "prototype";
  if (/\b(animation|motion|video|narration|voiceover)\b/.test(title)) return "animation";
  if (/\b(infographic|visualization|visualisation|dataviz)\b/.test(title)) return "infographic";
  if (/\b(variant|variants|exploration|directions)\b/.test(title)) return "design-variants";
  if (/\b(review|critique|score)\b/.test(title)) return "review";
  return input.hasIndexFile ? "html" : "deck";
}

function normalizeArtifactKind(value: unknown): StudioArtifactKind {
  switch (value) {
    case "prototype":
    case "animation":
    case "infographic":
    case "design-variants":
    case "review":
    case "html":
      return value;
    default:
      return "deck";
  }
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

async function readPlanFile(deckPath: string): Promise<StudioDeckPlan | undefined> {
  try {
    const raw = await readFile(join(deckPath, DECK_PLAN_FILE), "utf8");
    const parsed = JSON.parse(raw) as Partial<StudioDeckPlan>;
    if (!isPlanRecord(parsed)) return undefined;
    return {
      audience: String(parsed.audience),
      keyMessage: String(parsed.keyMessage),
      exportPath: VALID_EXPORT_PATHS.has(String(parsed.exportPath))
        ? (parsed.exportPath as StudioDeckPlan["exportPath"])
        : "html",
      slideCount:
        Number.isFinite(parsed.slideCount) && Number(parsed.slideCount) > 0
          ? Math.max(1, Math.min(40, Math.round(Number(parsed.slideCount))))
          : 5,
      mode: parsed.mode === "pptx-safe" ? "pptx-safe" : "freeform",
      notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
      status: VALID_PLAN_STATUSES.has(String(parsed.status))
        ? (parsed.status as StudioDeckPlan["status"])
        : "pending",
      createdAt: Number(parsed.createdAt) || Date.now(),
      confirmedAt:
        typeof parsed.confirmedAt === "number" ? parsed.confirmedAt : undefined,
    };
  } catch {
    return undefined;
  }
}

async function writePlanFile(deckPath: string, plan: StudioDeckPlan): Promise<void> {
  await mkdir(deckPath, { recursive: true });
  await writeFile(
    join(deckPath, DECK_PLAN_FILE),
    JSON.stringify(plan, null, 2),
    "utf8",
  );
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isPlanRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function sanitizePlanInput(input: StudioDeckPlanInput): StudioDeckPlanInput {
  const audience = (input.audience ?? "").toString().trim();
  const keyMessage = (input.keyMessage ?? "").toString().trim();
  if (!audience) throw new Error("Plan needs an audience.");
  if (!keyMessage) throw new Error("Plan needs a key message.");
  if (!VALID_EXPORT_PATHS.has(input.exportPath)) {
    throw new Error("Plan export path must be one of: html, html-pdf, pptx.");
  }
  if (!Number.isFinite(input.slideCount) || input.slideCount <= 0) {
    throw new Error("Plan needs a slide count > 0.");
  }
  if (input.mode !== "freeform" && input.mode !== "pptx-safe") {
    throw new Error("Plan mode must be freeform or pptx-safe.");
  }
  if (input.exportPath === "pptx" && input.mode !== "pptx-safe") {
    throw new Error(
      "Editable PPTX export requires pptx-safe mode in the plan.",
    );
  }
  const status =
    input.status && VALID_PLAN_STATUSES.has(input.status) ? input.status : "pending";
  return {
    audience,
    keyMessage,
    exportPath: input.exportPath,
    slideCount: Math.max(1, Math.min(40, Math.round(input.slideCount))),
    mode: input.mode,
    notes: input.notes?.toString().trim() || undefined,
    status,
  };
}

function requireConfirmedPlan(deck: StudioDeckProject): void {
  if (!deck.plan) {
    throw new Error(
      "Deck has no confirmed plan. Ask the agent to write deck-plan.json with audience, keyMessage, exportPath, slideCount, and mode, then confirm it from the Studio panel.",
    );
  }
  if (deck.plan.status !== "confirmed") {
    throw new Error(
      "Deck plan is pending. Confirm the plan in the Studio panel before exporting.",
    );
  }
}

function sanitizeTweaks(value: unknown): StudioDeckTweaks {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const tweaks: StudioDeckTweaks = {};
  if (
    typeof record["theme"] === "string" &&
    VALID_THEMES.has(record["theme"] as string)
  ) {
    tweaks.theme = record["theme"] as StudioDeckTweaks["theme"];
  }
  if (
    typeof record["density"] === "string" &&
    VALID_DENSITIES.has(record["density"] as string)
  ) {
    tweaks.density = record["density"] as StudioDeckTweaks["density"];
  }
  if (
    typeof record["imageStyle"] === "string" &&
    VALID_IMAGE_STYLES.has(record["imageStyle"] as string)
  ) {
    tweaks.imageStyle = record["imageStyle"] as StudioDeckTweaks["imageStyle"];
  }
  return tweaks;
}

/**
 * Tweaks are applied as CSS variables in `shared/tweaks.css`. Slides opt in by
 * linking it. We always write the file so that toggling tweaks updates the
 * preview without slide edits.
 */
async function writeTweaksCss(deckPath: string, tweaks: StudioDeckTweaks): Promise<void> {
  const sharedDir = join(deckPath, "shared");
  await mkdir(sharedDir, { recursive: true });
  const themeBlocks: Record<NonNullable<StudioDeckTweaks["theme"]>, string> = {
    default: "--studio-bg: #faf8f1; --studio-fg: #171714;",
    light: "--studio-bg: #ffffff; --studio-fg: #111111;",
    dark: "--studio-bg: #0f1115; --studio-fg: #f5f5f0;",
    warm: "--studio-bg: #fff4e6; --studio-fg: #2a1d10;",
    cool: "--studio-bg: #eef4ff; --studio-fg: #0d1b2a;",
  };
  const densityBlocks: Record<NonNullable<StudioDeckTweaks["density"]>, string> = {
    comfortable: "--studio-density-scale: 1; --studio-gap: 28px;",
    compact: "--studio-density-scale: 0.88; --studio-gap: 18px;",
    spacious: "--studio-density-scale: 1.12; --studio-gap: 38px;",
  };
  const imageBlocks: Record<NonNullable<StudioDeckTweaks["imageStyle"]>, string> = {
    default: "--studio-image-filter: none;",
    muted: "--studio-image-filter: saturate(0.7) contrast(0.95);",
    vivid: "--studio-image-filter: saturate(1.2) contrast(1.05);",
  };
  const theme = tweaks.theme ?? "default";
  const density = tweaks.density ?? "comfortable";
  const imageStyle = tweaks.imageStyle ?? "default";
  const css = `:root {\n  ${themeBlocks[theme]}\n  ${densityBlocks[density]}\n  ${imageBlocks[imageStyle]}\n}\nimg { filter: var(--studio-image-filter, none); }\n`;
  await writeFile(join(sharedDir, "tweaks.css"), css, "utf8");
}

/**
 * Verification gate. Runs for every export attempt and is also exposed via IPC
 * so the renderer can surface issues proactively.
 *
 * Baseline checks (all modes):
 *   - Slide files exist on disk.
 *   - Asset references (img/script/link/source) resolve to files inside the deck.
 *   - The HTML index file is present.
 *
 * Stricter checks (pptx-safe mode):
 *   - Same baseline + headless validateStudioPptxDeck (computed style rules).
 */
async function verifyDeckArtifact(
  deck: StudioDeckProject,
  options: { enforcePptxSafe?: boolean } = {},
): Promise<StudioDeckVerificationResult> {
  // Strict pptx-safe checks default to "on whenever the deck is configured for
  // pptx-safe", so the manual Verify deck button surfaces every issue. exportDeck
  // narrows this to format === "pptx" so PDF/HTML exports don't get blocked.
  const enforcePptxSafe = options.enforcePptxSafe ?? deck.mode === "pptx-safe";
  const issues: StudioDeckVerificationIssue[] = [];

  try {
    await access(deck.indexFile);
  } catch {
    issues.push({ level: "error", message: "Missing artifact index.html." });
  }

  if (deck.slides.length === 0) {
    issues.push({
      level: "error",
      message:
        deck.artifactKind === "deck"
          ? "Deck has no slides."
          : "Artifact has no preview entry.",
    });
  }

  for (const slide of deck.slides) {
    const slidePath = join(deck.path, slide.file);
    let html = "";
    try {
      html = await readFile(slidePath, "utf8");
    } catch {
      issues.push({
        level: "error",
        slide: slide.file,
        message: "Slide file is missing on disk.",
      });
      continue;
    }
    for (const asset of extractLocalAssets(html)) {
      const assetPath = resolveDeckAsset(deck.path, slidePath, asset);
      if (!assetPath) continue;
      try {
        await access(assetPath);
      } catch {
        issues.push({
          level: "error",
          slide: slide.file,
          message: `Missing referenced asset: ${asset}`,
        });
      }
    }
  }

  if (enforcePptxSafe) {
    for (const slide of deck.slides) {
      if (!slide.file.startsWith("slides/")) continue;
      try {
        const html = await readFile(join(deck.path, slide.file), "utf8");
        for (const [needle, message] of PPTX_SAFE_BANNED_SUBSTRINGS) {
          if (html.includes(needle)) {
            issues.push({ level: "error", slide: slide.file, message });
          }
        }
      } catch {
        // Missing-file errors already reported above.
      }
    }
    if (issues.every((issue) => issue.level !== "error")) {
      try {
        const pptxResult = await validateStudioPptxDeck(deck);
        for (const message of pptxResult.errors) {
          issues.push(classifyPptxValidationIssue(message));
        }
      } catch (error) {
        issues.push({
          level: "error",
          message: `PPTX validation crashed: ${(error as Error).message}`,
        });
      }
    }
  }

  return {
    ok: issues.every((issue) => issue.level !== "error"),
    issues,
    checkedAt: Date.now(),
  };
}

function classifyPptxValidationIssue(message: string): StudioDeckVerificationIssue {
  // These are useful layout heuristics but too strict to hard-block export in
  // real decks. Keep them visible in Verify as warnings.
  if (
    message.includes("HTML content overflows the slide body.") ||
    message.includes("Text ends too close to the slide bottom:")
  ) {
    return { level: "warning", message };
  }
  return { level: "error", message };
}

function extractLocalAssets(html: string): string[] {
  const assets: string[] = [];
  const attrPattern = /(?:src|href|poster|data-src)\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(html))) {
    const value = match[1]!.trim();
    if (!value) continue;
    if (/^(?:https?:|data:|blob:|mailto:|tel:|javascript:|about:|#)/i.test(value)) continue;
    assets.push(value);
  }
  return assets;
}

function resolveDeckAsset(
  deckPath: string,
  slidePath: string,
  asset: string,
): string | undefined {
  if (asset.startsWith("//")) return undefined;
  const cleaned = asset.split(/[?#]/)[0]!;
  if (!cleaned) return undefined;
  const base = isAbsolute(cleaned)
    ? join(deckPath, cleaned.replace(/^\/+/, ""))
    : resolve(dirname(slidePath), cleaned);
  // Constrain to deck directory to avoid noise from environment-relative paths.
  const normalized = resolve(base);
  const root = resolve(deckPath);
  if (!normalized.startsWith(root + sep) && normalized !== root) return undefined;
  return normalized;
}
