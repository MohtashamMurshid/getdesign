import { BrowserWindow } from "electron";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";

import type { StudioDeckProject } from "../shared/studio-api";

const PX_PER_IN = 96;
const MIN_BOTTOM_MARGIN_IN = 0.35;

type PptxValidationResult = {
  ok: boolean;
  errors: string[];
};

type SlideElement =
  | {
      type: "text";
      text: string;
      tag: string;
      position: Box;
      style: TextStyle;
    }
  | {
      type: "list";
      items: string[];
      ordered: boolean;
      position: Box;
      style: TextStyle;
    }
  | {
      type: "image";
      src: string;
      position: Box;
    }
  | {
      type: "shape";
      position: Box;
      style: ShapeStyle;
    };

type SlideSnapshot = {
  width: number;
  height: number;
  background: string;
  elements: SlideElement[];
  errors: string[];
};

type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type TextStyle = {
  color: string;
  fontSize: number;
  fontFace: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right" | "justify";
  lineSpacing: number;
  opacity: number;
};

type ShapeStyle = {
  fill?: string;
  transparency?: number;
  line?: {
    color: string;
    transparency?: number;
    width: number;
  };
  radius: number;
};

export async function validateStudioPptxDeck(
  deck: StudioDeckProject,
  parentWindow?: BrowserWindow,
): Promise<PptxValidationResult> {
  if (deck.mode !== "pptx-safe") {
    return {
      ok: false,
      errors: [
        "Editable PPTX export requires pptx-safe mode. Create or regenerate the deck for editable PPTX before exporting.",
      ],
    };
  }

  const snapshots = await captureDeck(deck, parentWindow);
  const errors = snapshots.flatMap(({ file, snapshot }) =>
    snapshot.errors.map((error) => `${file}: ${error}`),
  );

  return { ok: errors.length === 0, errors };
}

export async function exportStudioDeckPptx(
  deck: StudioDeckProject,
  outputPath: string,
  parentWindow?: BrowserWindow,
): Promise<void> {
  const snapshots = await captureDeck(deck, parentWindow);
  const errors = snapshots.flatMap(({ file, snapshot }) =>
    snapshot.errors.map((error) => `${file}: ${error}`),
  );
  if (errors.length > 0) {
    throw new Error(`PPTX validation failed:\n${errors.join("\n")}`);
  }

  const first = snapshots[0]?.snapshot;
  if (!first) throw new Error("Deck has no slides to export.");

  const pres = new pptxgen();
  pres.author = "getdesign Studio";
  pres.company = "getdesign";
  pres.subject = "Studio HTML deck export";
  pres.title = deck.title;
  pres.defineLayout({
    name: "STUDIO_DECK",
    width: first.width / PX_PER_IN,
    height: first.height / PX_PER_IN,
  });
  pres.layout = "STUDIO_DECK";

  for (const { snapshot } of snapshots) {
    const slide = pres.addSlide();
    slide.background = { color: normalizeColor(snapshot.background) ?? "FFFFFF" };

    for (const element of snapshot.elements) {
      if (element.type === "shape") {
        const options = {
          x: toInches(element.position.x),
          y: toInches(element.position.y),
          w: toInches(element.position.w),
          h: toInches(element.position.h),
          fill: element.style.fill
            ? {
                color: element.style.fill,
                transparency: element.style.transparency,
              }
            : { transparency: 100 },
          line: element.style.line ?? { transparency: 100 },
          rectRadius: toInches(element.style.radius),
        };
        slide.addShape(
          element.style.radius > 0 ? pres.ShapeType.roundRect : pres.ShapeType.rect,
          options,
        );
        continue;
      }

      if (element.type === "image") {
        slide.addImage({
          path: localImagePath(element.src),
          x: toInches(element.position.x),
          y: toInches(element.position.y),
          w: toInches(element.position.w),
          h: toInches(element.position.h),
        });
        continue;
      }

      if (element.type === "list") {
        slide.addText(
          element.items.map((item) => ({
            text: item,
            options: element.ordered
              ? { bullet: { type: "number" as const } }
              : { bullet: true },
          })),
          textOptions(element.position, element.style),
        );
        continue;
      }

      slide.addText(element.text, textOptions(element.position, element.style));
    }
  }

  const data = await pres.write({ outputType: "nodebuffer" });
  await writeFile(outputPath, Buffer.from(data as ArrayBuffer));
}

async function captureDeck(deck: StudioDeckProject, parentWindow?: BrowserWindow) {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    parent: parentWindow,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    const snapshots: Array<{ file: string; snapshot: SlideSnapshot }> = [];
    for (const slide of deck.slides) {
      const file = slide.file;
      if (!file.startsWith("slides/")) continue;
      await win.loadFile(`${deck.path}/${file}`);
      await waitForSlideLoad(win);
      snapshots.push({
        file,
        snapshot: await win.webContents.executeJavaScript(extractSlideSnapshotSource()),
      });
    }
    return snapshots;
  } finally {
    win.destroy();
  }
}

function waitForSlideLoad(win: BrowserWindow): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 1200);
    win.webContents.once("did-frame-finish-load", () => setTimeout(resolve, 350));
  });
}

function textOptions(position: Box, style: TextStyle) {
  return {
    x: toInches(position.x),
    y: toInches(position.y),
    w: toInches(position.w),
    h: toInches(position.h),
    fontSize: style.fontSize * 0.75,
    fontFace: style.fontFace,
    color: normalizeColor(style.color) ?? "111111",
    bold: style.bold,
    italic: style.italic,
    underline: style.underline ? {} : undefined,
    align: style.align,
    valign: "top" as const,
    breakLine: false,
    fit: "shrink" as const,
    margin: 0,
    inset: 0,
    transparency: Math.round((1 - style.opacity) * 100),
    breakLineOnHyphen: false,
    lineSpacingMultiple: style.lineSpacing,
  };
}

function toInches(px: number) {
  return px / PX_PER_IN;
}

function localImagePath(src: string) {
  if (src.startsWith("file://")) return fileURLToPath(src);
  if (src.startsWith("/")) return src;
  return src;
}

function normalizeColor(color: string | undefined) {
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return undefined;
  const rgb = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!rgb) return color.replace(/^#/, "").slice(0, 6).toUpperCase();
  return [rgb[1], rgb[2], rgb[3]]
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function extractSlideSnapshotSource() {
  return `(() => {
    const PX_PER_IN = ${PX_PER_IN};
    const MIN_BOTTOM_MARGIN_IN = ${MIN_BOTTOM_MARGIN_IN};
    const textTags = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6"]);
    const listTags = new Set(["UL", "OL"]);
    const errors = [];
    const body = document.body;
    const bodyStyle = getComputedStyle(body);
    const bodyRect = body.getBoundingClientRect();
    const bodyWidth = parseFloat(bodyStyle.width) || bodyRect.width || window.innerWidth;
    const bodyHeight = parseFloat(bodyStyle.height) || bodyRect.height || window.innerHeight;
    const scrollWidth = Math.max(body.scrollWidth, document.documentElement.scrollWidth);
    const scrollHeight = Math.max(body.scrollHeight, document.documentElement.scrollHeight);

    if (Math.abs(bodyWidth / bodyHeight - 16 / 9) > 0.02) {
      errors.push("Body must use a 16:9 wide layout.");
    }
    if (scrollWidth - bodyWidth > 2 || scrollHeight - bodyHeight > 2) {
      errors.push("HTML content overflows the slide body.");
    }

    function isVisible(el) {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && parseFloat(style.opacity || "1") > 0 && rect.width > 0 && rect.height > 0;
    }

    function hasGradient(value) {
      return /gradient\\(/i.test(value || "");
    }

    function hasBackgroundImage(value) {
      return value && value !== "none";
    }

    function isTransparent(color) {
      return !color || color === "transparent" || color === "rgba(0, 0, 0, 0)";
    }

    function normalizeColor(color) {
      if (isTransparent(color)) return undefined;
      const rgb = color.match(/^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/i);
      if (!rgb) return color.replace(/^#/, "").slice(0, 6).toUpperCase();
      return [rgb[1], rgb[2], rgb[3]].map((part) => Number(part).toString(16).padStart(2, "0")).join("").toUpperCase();
    }

    function alpha(color) {
      const rgba = color.match(/^rgba\\(\\d+,\\s*\\d+,\\s*\\d+,\\s*([\\d.]+)\\)$/i);
      return rgba ? Number(rgba[1]) : 1;
    }

    function box(el) {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - bodyRect.left,
        y: rect.top - bodyRect.top,
        w: rect.width,
        h: rect.height,
      };
    }

    function textStyle(el) {
      const style = getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize) || 16;
      const lineHeightPx = style.lineHeight === "normal" ? fontSize * 1.2 : parseFloat(style.lineHeight) || fontSize * 1.2;
      return {
        color: normalizeColor(style.color) || "111111",
        fontSize,
        fontFace: style.fontFamily.split(",")[0].replace(/["']/g, "").trim() || "Arial",
        bold: Number(style.fontWeight) >= 600 || style.fontWeight === "bold",
        italic: style.fontStyle === "italic",
        underline: style.textDecorationLine.includes("underline"),
        align: ["left", "center", "right", "justify"].includes(style.textAlign) ? style.textAlign : "left",
        lineSpacing: lineHeightPx / fontSize,
        opacity: parseFloat(style.opacity || "1"),
      };
    }

    function shapeStyle(el) {
      const style = getComputedStyle(el);
      const fill = normalizeColor(style.backgroundColor);
      const borderWidth = parseFloat(style.borderTopWidth) || 0;
      const borderColor = normalizeColor(style.borderTopColor);
      return {
        fill,
        transparency: fill ? Math.round((1 - alpha(style.backgroundColor)) * 100) : undefined,
        line: borderWidth > 0 && borderColor ? {
          color: borderColor,
          transparency: Math.round((1 - alpha(style.borderTopColor)) * 100),
          width: borderWidth * 0.75,
        } : undefined,
        radius: parseFloat(style.borderTopLeftRadius) || 0,
      };
    }

    function textContent(el) {
      return Array.from(el.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE)
        .map((node) => node.textContent || "")
        .join("")
        .replace(/\\s+/g, " ")
        .trim();
    }

    for (const el of Array.from(body.querySelectorAll("*"))) {
      if (!isVisible(el)) continue;
      const tag = el.tagName;
      const style = getComputedStyle(el);
      if (hasGradient(style.backgroundImage) || hasGradient(style.background)) {
        errors.push(tag.toLowerCase() + " uses a CSS gradient, which is not editable-PPTX safe.");
      }
      if (tag === "DIV" && hasBackgroundImage(style.backgroundImage)) {
        errors.push("div uses background-image; use an img element instead.");
      }
      if (tag === "DIV") {
        const directText = Array.from(el.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent || "")
          .join("")
          .trim();
        if (directText) errors.push("div contains unwrapped text: " + directText.slice(0, 60));
      }
      if (textTags.has(tag)) {
        if (!isTransparent(style.backgroundColor)) errors.push(tag.toLowerCase() + " has a background; put backgrounds on a wrapping div.");
        if ((parseFloat(style.borderTopWidth) || 0) > 0) errors.push(tag.toLowerCase() + " has a border; put borders on a wrapping div.");
        if (style.boxShadow && style.boxShadow !== "none") errors.push(tag.toLowerCase() + " has a shadow; put shadows on a wrapping div.");
      }
    }

    const elements = [];
    const shapeCandidates = Array.from(body.querySelectorAll("div, article, section, main, aside, header, footer"));
    for (const el of shapeCandidates) {
      if (!isVisible(el)) continue;
      const style = getComputedStyle(el);
      const fill = normalizeColor(style.backgroundColor);
      const borderWidth = parseFloat(style.borderTopWidth) || 0;
      if (!fill && borderWidth === 0) continue;
      elements.push({ type: "shape", position: box(el), style: shapeStyle(el) });
    }

    for (const img of Array.from(body.querySelectorAll("img"))) {
      if (!isVisible(img)) continue;
      elements.push({ type: "image", src: img.src, position: box(img) });
    }

    for (const list of Array.from(body.querySelectorAll("ul, ol"))) {
      if (!isVisible(list)) continue;
      const items = Array.from(list.children).map((item) => textContent(item)).filter(Boolean);
      if (items.length > 0) {
        elements.push({ type: "list", items, ordered: list.tagName === "OL", position: box(list), style: textStyle(list) });
      }
    }

    for (const el of Array.from(body.querySelectorAll("p, h1, h2, h3, h4, h5, h6"))) {
      if (!isVisible(el)) continue;
      const text = textContent(el);
      if (!text) continue;
      const position = box(el);
      const style = textStyle(el);
      const distanceFromBottom = bodyHeight / PX_PER_IN - (position.y + position.h) / PX_PER_IN;
      if (style.fontSize > 16 && distanceFromBottom < MIN_BOTTOM_MARGIN_IN) {
        errors.push("Text ends too close to the slide bottom: " + text.slice(0, 60));
      }
      elements.push({ type: "text", text, tag: el.tagName.toLowerCase(), position, style });
    }

    elements.sort((a, b) => (a.position.y - b.position.y) || (a.position.x - b.position.x));

    return {
      width: bodyWidth,
      height: bodyHeight,
      background: normalizeColor(bodyStyle.backgroundColor) || "FFFFFF",
      elements,
      errors,
    };
  })()`;
}
