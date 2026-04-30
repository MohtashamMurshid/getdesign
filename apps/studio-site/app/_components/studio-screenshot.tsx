"use client";

import { SiClaude } from "@icons-pack/react-simple-icons";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { StudioMark } from "./studio-mark";

const SEARCH_QUERY = `"claude design launch decks"`;

const USER_MESSAGE =
  "Plan a 7-slide launch deck for an OSS Claude Design alternative.";

const THOUGHT_PARA =
  "Building an OSS alternative to Claude Design needs a punchy, visionary, clear launch deck. Here is a proposed 7-slide outline.";

const OUTLINE_L1 = "1. Title slide";
const OUTLINE_L2 =
  "Headline: Northwind — brand refresh";
const OUTLINE_L3 =
  "Angle: credibility first, motion second; lead with the product story.";

const SLIDE_TITLE = "Credibility before the rebrand story";
const SLIDE_BODY =
  "Lead with outcomes customers already trust — uptime, compliance, and time-to-ship — then introduce the visual system so marketing and product stay in sync.";

/** ms per character for chat streams */
const CHAT_CPS_MS = 18;
/** Deck starts after chat has streamed render_preview for a beat */
const DECK_START_MS = 9200;
/** ms per character on slide headline/body */
const DECK_CPS_MS = 15;
const LOOP_RESET_MS = 17_500;

export function StudioScreenshot() {
  const [ms, setMs] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const t0Ref = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const check = () => setReduceMotion(mq.matches);
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  const tick = useCallback((now: number) => {
    if (t0Ref.current === null) t0Ref.current = now;
    let elapsed = now - t0Ref.current;
    if (!reduceMotion && elapsed >= LOOP_RESET_MS) {
      t0Ref.current = now;
      elapsed = 0;
    }
    setMs(elapsed);
    rafRef.current = requestAnimationFrame(tick);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      setMs(999_999);
      return;
    }
    t0Ref.current = null;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reduceMotion, tick]);

  const chat = useMemo(
    () => computeChatStream(ms, reduceMotion),
    [ms, reduceMotion],
  );
  const deck = useMemo(
    () => computeDeckStream(ms, reduceMotion),
    [ms, reduceMotion],
  );

  return (
    <section id="studio" className="relative w-full scroll-mt-20 pb-24">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <div className="fade-in-up delay-5 hero-shadow overflow-hidden rounded-[18px] border border-black/10 bg-[#fafaf7] text-[#0a0a0b]">
          <WindowChrome />
          <div className="grid grid-cols-1 md:grid-cols-[340px_1fr]">
            <ChatSidebar chat={chat} />
            <DeckWorkspace deck={deck} />
          </div>
        </div>

        <p className="mt-6 text-center text-[0.78rem] text-subtle">
          getdesign Studio &middot; chat, artifacts, and live deck preview in one
          window
        </p>
      </div>
    </section>
  );
}

type ChatStreams = {
  userMsg: string;
  showThoughtLabel: boolean;
  showToolSearch: boolean;
  searchQueryTyped: string;
  thoughtPara: string;
  showWriteFile: boolean;
  outlineL1: string;
  outlineL2: string;
  outlineL3: string;
  showRenderPreview: boolean;
  renderStreaming: boolean;
};

type DeckStreams = {
  slideTitle: string;
  slideBody: string;
  showSlideMeta: boolean;
  showSlideFooter: boolean;
  deckArmed: boolean;
};

function computeChatStream(ms: number, full: boolean): ChatStreams {
  if (full) {
    return {
      userMsg: USER_MESSAGE,
      showThoughtLabel: true,
      showToolSearch: true,
      searchQueryTyped: SEARCH_QUERY,
      thoughtPara: THOUGHT_PARA,
      showWriteFile: true,
      outlineL1: OUTLINE_L1,
      outlineL2: OUTLINE_L2,
      outlineL3: OUTLINE_L3,
      showRenderPreview: true,
      renderStreaming: false,
    };
  }

  const qFull = SEARCH_QUERY;
  const searchCps = 9;

  let t = 0;

  const userEnd = t + USER_MESSAGE.length * CHAT_CPS_MS;
  const userMsg =
    ms < t
      ? ""
      : ms >= userEnd
        ? USER_MESSAGE
        : USER_MESSAGE.slice(0, Math.floor((ms - t) / CHAT_CPS_MS));
  t = userEnd;

  t += 90;
  const showThoughtLabel = ms >= t;

  t += 110;
  const showToolSearch = ms >= t;

  let searchQueryTyped = "";
  if (showToolSearch) {
    const qs = t;
    const qe = t + qFull.length * searchCps;
    if (ms >= qe) searchQueryTyped = qFull;
    else if (ms > qs)
      searchQueryTyped = qFull.slice(0, Math.floor((ms - qs) / searchCps));
    t = qe;
  }

  t += 150;
  const thoughtStart = t;
  const thoughtEnd = thoughtStart + THOUGHT_PARA.length * CHAT_CPS_MS;
  const thoughtPara =
    ms < thoughtStart
      ? ""
      : ms >= thoughtEnd
        ? THOUGHT_PARA
        : THOUGHT_PARA.slice(
            0,
            Math.floor((ms - thoughtStart) / CHAT_CPS_MS),
          );
  t = thoughtEnd + 100;

  const showWriteFile = ms >= t;
  t += 300;

  const l1 = OUTLINE_L1.length * CHAT_CPS_MS;
  const l2 = OUTLINE_L2.length * CHAT_CPS_MS;
  const l3 = OUTLINE_L3.length * CHAT_CPS_MS;
  const outlineStart = t;

  let outlineL1 = "";
  let outlineL2 = "";
  let outlineL3 = "";
  if (ms >= outlineStart) {
    if (ms < outlineStart + l1) {
      outlineL1 = OUTLINE_L1.slice(
        0,
        Math.floor((ms - outlineStart) / CHAT_CPS_MS),
      );
    } else if (ms < outlineStart + l1 + l2) {
      outlineL1 = OUTLINE_L1;
      outlineL2 = OUTLINE_L2.slice(
        0,
        Math.floor((ms - outlineStart - l1) / CHAT_CPS_MS),
      );
    } else if (ms < outlineStart + l1 + l2 + l3) {
      outlineL1 = OUTLINE_L1;
      outlineL2 = OUTLINE_L2;
      outlineL3 = OUTLINE_L3.slice(
        0,
        Math.floor((ms - outlineStart - l1 - l2) / CHAT_CPS_MS),
      );
    } else {
      outlineL1 = OUTLINE_L1;
      outlineL2 = OUTLINE_L2;
      outlineL3 = OUTLINE_L3;
    }
    t = outlineStart + l1 + l2 + l3;
  }

  t += 130;
  const showRenderPreview = ms >= t;
  const renderDoneAt = t + 700;
  const renderStreaming = showRenderPreview && ms < renderDoneAt;

  return {
    userMsg,
    showThoughtLabel,
    showToolSearch,
    searchQueryTyped,
    thoughtPara,
    showWriteFile,
    outlineL1,
    outlineL2,
    outlineL3,
    showRenderPreview,
    renderStreaming,
  };
}

function computeDeckStream(ms: number, full: boolean): DeckStreams {
  if (full) {
    return {
      slideTitle: SLIDE_TITLE,
      slideBody: SLIDE_BODY,
      showSlideMeta: true,
      showSlideFooter: true,
      deckArmed: true,
    };
  }

  if (ms < DECK_START_MS) {
    return {
      slideTitle: "",
      slideBody: "",
      showSlideMeta: false,
      showSlideFooter: false,
      deckArmed: false,
    };
  }

  const titleStart = DECK_START_MS + 140;
  const showSlideMeta = ms >= DECK_START_MS;
  const titleEnd = titleStart + SLIDE_TITLE.length * DECK_CPS_MS;

  let slideTitle = "";
  if (ms >= titleStart) {
    slideTitle = SLIDE_TITLE.slice(
      0,
      Math.min(SLIDE_TITLE.length, Math.floor((ms - titleStart) / DECK_CPS_MS)),
    );
  }

  const bodyStart = titleEnd + 180;
  const bodyEnd = bodyStart + SLIDE_BODY.length * DECK_CPS_MS;
  let slideBody = "";
  if (ms >= bodyStart) {
    slideBody = SLIDE_BODY.slice(
      0,
      Math.min(SLIDE_BODY.length, Math.floor((ms - bodyStart) / DECK_CPS_MS)),
    );
  }

  const showSlideFooter = ms >= bodyEnd + 150;

  return {
    slideTitle,
    slideBody,
    showSlideMeta,
    showSlideFooter,
    deckArmed: showSlideMeta,
  };
}

function WindowChrome() {
  return (
    <div className="flex items-center gap-2 border-b border-black/8 bg-[#ecebe6] px-4 py-2.5">
      <span className="size-3 rounded-full bg-[#ff5f57]" />
      <span className="size-3 rounded-full bg-[#febc2e]" />
      <span className="size-3 rounded-full bg-[#28c840]" />
      <div className="ml-3 flex items-center gap-2 text-[0.75rem] text-black/45">
        <StudioMark size={14} />
        <span className="font-mono">getdesign Studio</span>
      </div>
    </div>
  );
}

function ChatSidebar({ chat }: { chat: ChatStreams }) {
  return (
    <aside className="flex min-h-[420px] flex-col gap-4 border-b border-black/8 bg-[#f4f3ee] p-4 md:min-h-[520px] md:border-b-0 md:border-r">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StudioMark size={16} />
          <span className="text-[0.78rem] font-medium tracking-tight">
            <span className="text-black/55">get</span>
            <span className="text-black">design</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-black/40">
          <ChromeBtn>☀</ChromeBtn>
          <ChromeBtn>+</ChromeBtn>
          <ChromeBtn>⚙</ChromeBtn>
          <ChromeBtn>▤</ChromeBtn>
        </div>
      </div>

      <div className="self-end max-w-[88%] rounded-2xl rounded-tr-md border border-black/8 bg-white px-3 py-2 text-[0.78rem] leading-snug text-black/85">
        {chat.userMsg}
        {chat.userMsg.length < USER_MESSAGE.length && (
          <span className="ml-px inline-block h-3 w-px animate-pulse bg-black/50 align-middle" />
        )}
      </div>

      {chat.showThoughtLabel && (
        <div className="fade-in-up text-[0.7rem] text-black/35">
          &gt; Thought
        </div>
      )}

      {chat.showToolSearch && (
        <div className="fade-in-up">
          <ToolCall
            name="web_search"
            status="ran"
            body={
              <span>
                <span className="text-black/55">query:</span>{" "}
                {chat.searchQueryTyped}
                {chat.searchQueryTyped.length < SEARCH_QUERY.length && (
                  <span className="ml-px inline-block h-2.5 w-px animate-pulse bg-emerald-600/70 align-middle" />
                )}
              </span>
            }
          />
        </div>
      )}

      {chat.thoughtPara.length > 0 && (
        <p className="text-[0.74rem] leading-relaxed text-black/55">
          {chat.thoughtPara}
          {chat.thoughtPara.length < THOUGHT_PARA.length && (
            <span className="ml-px inline-block h-3 w-px animate-pulse bg-black/40 align-middle" />
          )}
        </p>
      )}

      {chat.showWriteFile && (
        <div className="fade-in-up">
          <ToolCall
            name="write_file"
            status="ran"
            body={
              <span>
                <span className="text-black/55">path:</span>{" "}
                <span className="font-mono text-black/80">
                  slides/01-hero.html
                </span>
                <span className="text-black/35"> · 2.1 kB</span>
              </span>
            }
          />
        </div>
      )}

      {(chat.outlineL1 || chat.outlineL2 || chat.outlineL3) && (
        <div className="space-y-1.5 text-[0.78rem] leading-snug text-black/85">
          {chat.outlineL1 ? (
            <p className="font-semibold text-black">{chat.outlineL1}</p>
          ) : null}
          {chat.outlineL2 ? (
            <p className="text-black/65">
              <span className="text-black">{chat.outlineL2}</span>
            </p>
          ) : null}
          {chat.outlineL3 ? (
            <p className="text-black/65">
              <span className="text-black">{chat.outlineL3}</span>
            </p>
          ) : null}
        </div>
      )}

      {chat.showRenderPreview && (
        <div className="fade-in-up">
          <ToolCall
            name="render_preview"
            status={chat.renderStreaming ? "streaming" : "ran"}
            body={
              <span>
                <span className="text-black/55">deck:</span>{" "}
                <span className="font-mono text-black/80">
                  northwind-hero.html
                </span>
                {chat.renderStreaming && (
                  <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                    <span className="size-1 animate-pulse rounded-full bg-emerald-500" />
                    streaming
                  </span>
                )}
              </span>
            }
          />
        </div>
      )}

      <div className="mt-auto rounded-xl border border-black/8 bg-white p-3">
        <div className="text-[0.78rem] text-black/30">Message</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-md border border-black/10 bg-[#f4f3ee] px-2 py-1 text-[0.7rem] text-black/65">
            <SiClaude size={12} className="shrink-0 text-[#D97757]" />
            Claude Haiku 4.5
          </div>
          <button
            type="button"
            className="grid size-7 place-items-center rounded-full bg-black text-white"
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

function DeckWorkspace({ deck }: { deck: DeckStreams }) {
  return (
    <div className="flex flex-col bg-[#fafaf7]">
      <div
        className={`flex items-center justify-between border-b border-black/8 px-5 py-3 transition-opacity duration-500 ${
          deck.deckArmed ? "opacity-100" : "opacity-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-black/10 bg-white px-2.5 py-1 text-[0.74rem] font-medium text-black">
            Design Files
          </div>
          <div className="flex items-center gap-1.5 text-[0.74rem] text-black/45">
            <span className="font-medium text-black/70">Northwind rebrand</span>
            <span className="text-black/25">/</span>
            <span className="font-mono">launch-deck</span>
          </div>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-2.5 py-1 text-[0.74rem] text-black/65"
        >
          <FolderIcon /> Folder
        </button>
      </div>

      <div
        className={`px-5 pt-4 pb-3 transition-opacity duration-500 ${
          deck.showSlideMeta ? "opacity-100" : "opacity-40"
        }`}
      >
        <div className="text-[0.78rem] font-medium text-black">
          Northwind rebrand &middot; launch deck
        </div>
        <div className="text-[0.7rem] text-black/35">2 slides · freeform</div>
      </div>

      <div className="flex-1 px-5 pb-6">
        <SlidePreview deck={deck} />

        <div
          className={`mt-4 flex justify-center transition-opacity duration-500 ${
            deck.showSlideFooter ? "opacity-100" : "opacity-30"
          }`}
        >
          <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[0.74rem] text-black/65">
            <span className="flex items-center gap-1 text-black/45">
              <ChevLeft /> Prev
            </span>
            <span className="text-black">
              1 <span className="text-black/30">/</span> 2
            </span>
            <span className="flex items-center gap-1 text-black">
              Next <ChevRight />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlidePreview({ deck }: { deck: DeckStreams }) {
  const showCaretTitle =
    deck.slideTitle.length > 0 && deck.slideTitle.length < SLIDE_TITLE.length;
  const showCaretBody =
    deck.slideBody.length > 0 && deck.slideBody.length < SLIDE_BODY.length;

  return (
    <div
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-black/10 bg-gradient-to-br from-white via-[#faf9f6] to-[#f2f0eb] text-[#0a0a0b] shadow-inner transition-[filter,transform,opacity] duration-700 ease-out ${
        deck.deckArmed
          ? "translate-y-0 opacity-100 blur-0"
          : "translate-y-1 opacity-60 blur-[1.5px]"
      }`}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0a0a0b 1px, transparent 1px), linear-gradient(to bottom, #0a0a0b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex h-full flex-col justify-between px-8 py-7 md:px-12 md:py-9">
        <div
          className={`flex items-start justify-between gap-4 transition-opacity duration-300 ${
            deck.showSlideMeta ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-0.5 text-[0.62rem] tracking-wide text-black/55">
            Northwind
          </div>
          <span className="font-mono text-[0.65rem] text-black/35">Q2 2026</span>
        </div>

        <div className="max-w-[90%] md:max-w-[75%]">
          <h2 className="font-medium leading-[1.02] tracking-[-0.035em] text-black text-[clamp(26px,3.8vw,46px)]">
            {deck.slideTitle}
            {showCaretTitle && (
              <span className="ml-0.5 inline-block h-[0.85em] w-px animate-pulse bg-black/55 align-[-0.15em]" />
            )}
          </h2>
          <p className="mt-4 max-w-[46ch] text-[clamp(12px,1.05vw,15px)] leading-[1.55] text-black/55">
            {deck.slideBody}
            {showCaretBody && (
              <span className="ml-px inline-block h-[0.85em] w-px animate-pulse bg-black/40 align-[-0.15em]" />
            )}
          </p>
        </div>

        <div
          className={`flex flex-wrap items-end justify-between gap-4 border-t border-black/10 pt-5 transition-all duration-500 ${
            deck.showSlideFooter
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0"
          }`}
        >
          <div className="flex flex-wrap gap-2 text-[0.68rem] text-black/45">
            <span className="rounded-md border border-black/10 bg-white px-2 py-0.5 text-black/75">
              Brand
            </span>
            <span className="rounded-md border border-black/8 bg-black/[0.02] px-2 py-0.5 text-black/65">
              Product marketing
            </span>
            <span className="rounded-md border border-black/8 bg-black/[0.02] px-2 py-0.5 text-black/65">
              Sales enablement
            </span>
          </div>
          <span className="font-mono text-[0.68rem] text-black/35">
            Slide 01 of 02
          </span>
        </div>
      </div>
    </div>
  );
}

type ToolCallProps = {
  name: string;
  status: "ran" | "streaming";
  body: React.ReactNode;
};

function ToolCall({ name, status, body }: ToolCallProps) {
  return (
    <div className="rounded-lg border border-black/8 bg-white px-2.5 py-1.5">
      <div className="flex items-center gap-2 text-[0.68rem]">
        <span className="font-mono text-black/85">{name}()</span>
        <span
          className={`rounded-full px-1.5 py-px text-[0.6rem] ${
            status === "ran"
              ? "bg-black/[0.06] text-black/55"
              : "bg-emerald-500/15 text-emerald-700"
          }`}
        >
          {status === "ran" ? "ran" : "streaming"}
        </span>
      </div>
      <div className="mt-1 truncate text-[0.7rem] text-black/55">{body}</div>
    </div>
  );
}

function ChromeBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="grid size-6 place-items-center rounded-md text-[0.7rem] text-black/35 hover:bg-black/5 hover:text-black/70"
    >
      {children}
    </button>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function ChevLeft() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function ChevRight() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
