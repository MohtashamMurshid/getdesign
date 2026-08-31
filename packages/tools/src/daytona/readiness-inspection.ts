/** Read-only measurements returned by the in-sandbox probe. Never return page copy. */
export type ReadinessSnapshot = {
  state: "ready" | "loading" | "gate" | "blocked";
  reason: string;
  signature: string;
  viewport: { width: number; height: number; dpr: number };
  target?: { x: number; y: number };
};

/**
 * Serialized into Runtime.evaluate inside the sandbox. Keep this function
 * self-contained and read-only. Input and screenshots belong to Computer Use.
 */
export function inspectPageReadiness(): ReadinessSnapshot {
  const viewport = { width: innerWidth, height: innerHeight, dpr: devicePixelRatio };
  const result = (state: ReadinessSnapshot["state"], reason: string, signature = reason): ReadinessSnapshot =>
    ({ state, reason, signature, viewport });
  if (document.readyState !== "complete" || !document.body) {
    return result("loading", "document_loading");
  }

  const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
  const fingerprint = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
    return String(hash);
  };
  const label = (el: Element) => normalize(el.getAttribute("aria-label") || (el as HTMLElement).innerText || "");
  const visible = (el: Element) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
      rect.top < innerHeight && rect.left < innerWidth &&
      el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
  };
  const nodes = Array.from(document.body.querySelectorAll("*"));
  // Bound DOM work, too. Do not mistake an incomplete inspection for readiness.
  if (nodes.length > 10_000) return result("blocked", "inspection_limit");
  const visibleNodes = nodes.filter(visible);
  const hits = [0.15, 0.5, 0.85].flatMap((x) =>
    [0.15, 0.5, 0.85].map((y) => document.elementFromPoint(innerWidth * x, innerHeight * y)),
  );

  // Only consider a covering layer that is actually on top. A normal hero,
  // hidden splash, cookie banner, or unrelated "Start" CTA is not a gate.
  const overlays = visibleNodes.filter((el) => {
    const style = getComputedStyle(el);
    if (!["fixed", "absolute"].includes(style.position) &&
      el.getAttribute("aria-modal") !== "true" && el.tagName !== "DIALOG") return false;
    const r = el.getBoundingClientRect();
    const area = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) *
      Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return area >= innerWidth * innerHeight * 0.8 &&
      hits.filter((hit) => hit && el.contains(hit)).length >= 7;
  });
  const protectedMarker = /auth|login|sign.?in|sign.?up|cookie|consent|privacy|terms|age.?gate|age.?verif|paywall|captcha|challenge|verif|subscribe/i;
  // Prefer an identified gate inside a fixed app shell. Within that gate,
  // inspect the outer layer so sibling disclosures are not lost.
  const identified = overlays.filter((el) => {
    const marker = `${el.id} ${el.getAttribute("class") || ""}`;
    return /(?:^|[\s_-])(intro|splash|welcome|entry|enter|gate|preloader|loader|loading|spinner)(?:$|[\s_-])/i.test(marker) ||
      protectedMarker.test(marker) || el.getAttribute("aria-busy") === "true" ||
      el.getAttribute("aria-modal") === "true" || el.getAttribute("role") === "dialog" || el.tagName === "DIALOG";
  });
  const candidates = identified.length ? identified : overlays;
  const overlay = candidates.find((el) => !candidates.some((other) => other !== el && other.contains(el)));
  const scope = overlay ?? document.body;
  const text = normalize((scope as HTMLElement).innerText || "");
  const scopedNodes = visibleNodes.filter((el) => scope.contains(el));
  const controls = scopedNodes.filter((el) => el.matches("button, a[href], input, select, textarea, [role=button]"));
  const marker = overlay ? `${overlay.id} ${overlay.getAttribute("class") || ""}` : "";
  const intro = /(?:^|[\s_-])(intro|splash|welcome|entry|enter|gate)(?:$|[\s_-])/i.test(marker);
  const modal = overlay?.getAttribute("aria-modal") === "true" || overlay?.getAttribute("role") === "dialog" || overlay?.tagName === "DIALOG";
  const sparse = text.length <= 240 && controls.length <= 2;
  const loader = scopedNodes.some((el) =>
    el.getAttribute("aria-busy") === "true" || el.getAttribute("role") === "progressbar" ||
    /(?:^|[\s_-])(preloader|loader|loading|spinner)(?:$|[\s_-])/i.test(`${el.id} ${el.getAttribute("class") || ""}`),
  ) || scope.getAttribute("aria-busy") === "true" || /preloader|loader|loading|spinner/i.test(marker);
  const loadingCopy = /^(?:loading|please wait|loading (?:site|website|experience|content))(?:\s*\d+\s*%)?[.!…\s]*$/i.test(text);

  // These are never dismissal candidates. Inspect the whole covering layer,
  // including forms, frames, marker names, and button labels.
  const protectedCopy = /\b(log[\s-]*in|sign[\s-]*(?:in|up)|accounts?|register|password|subscribe|subscription|paywall|payment|purchase|checkout|buy|consent|cookies?|privacy|agree|accept|terms|age|adults?|birth|dob|18|21|verify|verification|captcha|robot|human|security|permission|allow|wallet|download|install)\b/i;
  const protectedControls = scopedNodes.some((el) =>
    el.matches("form, input, select, textarea, iframe") || el.shadowRoot !== null,
  );
  const controlCopy = controls.map((el) => `${label(el)} ${el.getAttribute("href") || ""}`).join(" ");
  const contentStructure = scopedNodes.some((el) => el.matches("main, nav, header, footer"));
  const gateLike = overlay && (intro || modal || !contentStructure);
  if (gateLike || (!overlay && sparse && !contentStructure)) {
    if (protectedControls || protectedCopy.test(`${text} ${controlCopy}`) || protectedMarker.test(marker)) {
      return result("blocked", "protected_gate");
    }
  }

  if (loadingCopy || scope.getAttribute("aria-busy") === "true" ||
    (loader && (overlay || (sparse && !contentStructure)))) return result("loading", "loader_visible");

  if (gateLike) {
    const button = controls[0];
    const safeLabel = button && /^(?:enter (?:the )?(?:site|website|experience)|click to enter|start (?:the )?experience)$/i.test(label(button));
    if (intro && sparse && controls.length === 1 && safeLabel && button?.tagName === "BUTTON" &&
      !button.closest("form, [inert], [aria-disabled=true]") && !button.hasAttribute("form") &&
      !button.matches(":disabled") && button.getAttribute("type") !== "submit" && button.getAttribute("aria-disabled") !== "true") {
      const r = button.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2);
      const y = Math.round(r.top + r.height / 2);
      const hit = document.elementFromPoint(x, y);
      if (r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight &&
        hit && button.contains(hit) && getComputedStyle(button).pointerEvents !== "none") {
        return {
          ...result("gate", "benign_intro", JSON.stringify([fingerprint(marker + text), r.x, r.y, r.width, r.height])),
          target: { x, y },
        };
      }
    }
    return result("blocked", "ambiguous_gate");
  }

  // A sparse click-to-enter page without a measurable intro overlay is not
  // safe to click, but should not silently become the captured design either.
  if (sparse && /\b(?:click to enter|enter (?:the )?(?:site|website)|start (?:the )?experience)\b/i.test(text)) {
    return result("blocked", "ambiguous_gate");
  }
  const media = scopedNodes.some((el) => el.matches("img, svg, canvas, video") || getComputedStyle(el).backgroundImage !== "none");
  if (!text && !media) return result("loading", "blank_page");

  return result("ready", "content_visible", JSON.stringify([
    document.documentElement.scrollWidth, document.documentElement.scrollHeight,
    text.length, visibleNodes.length,
  ]));
}

export function buildReadinessExpression(): string {
  return `JSON.stringify((${inspectPageReadiness.toString()})())`;
}
