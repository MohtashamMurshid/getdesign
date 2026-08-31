import { load } from "cheerio";
import { runInNewContext } from "node:vm";

import { buildReadinessExpression, type ReadinessSnapshot } from "../../src/daytona/readiness-inspection";

// Deterministic DOM fixtures with explicit layout measurements. No browser,
// provider, page script, or network is involved. Each frame is a DOM snapshot.
export const content = `<main data-rect="0,0,1024,1800"><h1>Studio projects</h1>
  <p>Independent design work for people building useful things.</p>
  <button>Start</button><a href="/login">Login</a>
  <section data-rect="0,500,1024,700">Selected work and recent projects</section>
  <footer data-rect="0,1700,1024,100">Contact the studio</footer></main>`;
export const loader = `${content}<div id="preloader" data-position="fixed" data-rect="0,0,1024,768" aria-busy="true">Loading...</div>`;
export const intro = `${content}<div id="intro-gate" data-position="fixed" data-rect="0,0,1024,768">
  <p>Welcome to the studio</p><button data-rect="400,350,224,60">Enter site</button></div>`;
export const ordinaryCta = content.replace(">Start<", ">Enter<");
export const protectedGate = (copy: string, extra = "") => intro.replace("Welcome to the studio", copy).replace("</button></div>", `</button>${extra}</div>`);

/** Evaluate the exact serialized production expression against fixture geometry. */
export function inspectFixture(html: string, readyState = "complete"): ReadinessSnapshot {
  const $ = load(html);
  const cache = new Map<unknown, FixtureElement>();
  function wrap(node: unknown): FixtureElement {
    let el = cache.get(node);
    if (!el) { el = new FixtureElement(node); cache.set(node, el); }
    return el;
  }
  class FixtureElement {
    constructor(readonly node: any) {}
    get tagName() { return String(this.node.tagName).toUpperCase(); }
    get id() { return this.getAttribute("id") || ""; }
    get shadowRoot() { return this.hasAttribute("data-shadow") ? {} : null; }
    get innerText(): string {
      if (!this.checkVisibility()) return "";
      return $(this.node).contents().toArray().map((child: any) =>
        child.type === "text" ? child.data : wrap(child).innerText,
      ).join(" ");
    }
    get scrollHeight() { return 1800; }
    get scrollWidth() { return 1024; }
    getAttribute(name: string) { return $(this.node).attr(name) ?? null; }
    hasAttribute(name: string) { return this.getAttribute(name) !== null; }
    matches(selector: string) { return $(this.node).is(selector); }
    closest(selector: string) { const node = $(this.node).closest(selector).get(0); return node ? wrap(node) : null; }
    contains(el: FixtureElement) { return el === this || $(el.node).parents().toArray().includes(this.node); }
    querySelectorAll(selector: string) { return $(this.node).find(selector).toArray().map(wrap); }
    checkVisibility() {
      return !$(this.node).is("[hidden], [data-hidden], script, style") &&
        !$(this.node).parents("[hidden], [data-hidden]").length;
    }
    getBoundingClientRect() {
      const [x = 0, y = 0, width = 100, height = 30] = (this.getAttribute("data-rect") || "0,0,100,30").split(",").map(Number);
      return { x, y, left: x, top: y, width, height, right: x + width, bottom: y + height };
    }
  }
  const document = {
    body: wrap($("body").get(0)),
    documentElement: wrap($("html").get(0)),
    readyState,
    elementFromPoint(x: number, y: number) {
      return $("body, body *").toArray().map(wrap).filter((el) => {
        const r = el.getBoundingClientRect();
        return el.checkVisibility() && el.getAttribute("data-pointer-events") !== "none" &&
          x >= r.left && y >= r.top && x <= r.right && y <= r.bottom;
      }).at(-1) ?? null;
    },
  };
  return JSON.parse(runInNewContext(buildReadinessExpression(), {
    document, innerWidth: 1024, innerHeight: 768, devicePixelRatio: 1,
    getComputedStyle(el: FixtureElement) {
      return {
        position: el.getAttribute("data-position") || "static",
        pointerEvents: el.getAttribute("data-pointer-events") || "auto",
        backgroundImage: "none",
      };
    },
  }));
}
