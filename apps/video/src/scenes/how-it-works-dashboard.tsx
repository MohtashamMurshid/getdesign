import type { ReactNode } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { colors, msToFrames, standardEase } from "../design-tokens";
import { fontMono, fontSans } from "../fonts";
import type { DemoSite, SurfaceId } from "./dashboard-data";
import {
  AGENT_LAYERS,
  DEMO_SITES,
  DEFAULT_DEMO_SITE_ID,
  SURFACE_ARCHITECTURE,
  SURFACE_NAV,
  chromeLabel,
} from "./dashboard-data";

const COL = {
  fn: "#60a5fa",
  key: "#c084fc",
  str: "#a3e635",
  num: "#fbbf24",
  com: colors.subtle,
  punc: colors.muted,
} as const;

function Tx({
  c,
  children,
}: {
  c: keyof typeof COL;
  children: ReactNode;
}) {
  return <span style={{ color: COL[c] }}>{children}</span>;
}

function makeBackendSteps(url: string) {
  return [
    {
      kind: "call" as const,
      node: (
        <>
          <Tx c="fn">getdesign.crawl</Tx>
          <Tx c="punc">({"{ "}</Tx>
          <Tx c="key">url</Tx>
          <Tx c="punc">: </Tx>
          <Tx c="str">&quot;{url}&quot;</Tx>
          <Tx c="punc">{" }"}</Tx>
        </>
      ),
    },
    {
      kind: "ok" as const,
      node: (
        <>
          fetched html + 4 stylesheets · <Tx c="num">128ms</Tx>
        </>
      ),
    },
    {
      kind: "call" as const,
      node: (
        <>
          <Tx c="fn">getdesign.screenshot</Tx>
          <Tx c="punc">({"{ "}</Tx>
          <Tx c="key">viewport</Tx>
          <Tx c="punc">: </Tx>
          <Tx c="str">&quot;1440x900&quot;</Tx>
          <Tx c="punc">{" }"}</Tx>
        </>
      ),
    },
    {
      kind: "info" as const,
      node: (
        <>
          chromium · daytona sandbox · hero.png <Tx c="com">1.2MB</Tx>
        </>
      ),
    },
    {
      kind: "call" as const,
      node: (
        <>
          <Tx c="fn">getdesign.extract</Tx>
          <Tx c="punc">({"{ "}</Tx>
          <Tx c="key">tokens</Tx>
          <Tx c="punc">: </Tx>
          <Tx c="str">&quot;all&quot;</Tx>
          <Tx c="punc">{" }"}</Tx>
        </>
      ),
    },
    {
      kind: "ok" as const,
      node: (
        <>
          14 tokens · <Tx c="num">4</Tx> palette · <Tx c="num">2</Tx> fonts ·{" "}
          <Tx c="num">6</Tx> radii
        </>
      ),
    },
    {
      kind: "call" as const,
      node: (
        <>
          <Tx c="fn">getdesign.synthesize</Tx>
          <Tx c="punc">()</Tx>
        </>
      ),
    },
    {
      kind: "ok" as const,
      node: (
        <>
          wrote <Tx c="str">design.md</Tx> · <Tx c="num">9</Tx> sections ·{" "}
          <Tx c="num">14.3KB</Tx>
        </>
      ),
    },
  ];
}

function StepGlyph({ kind }: { kind: "call" | "ok" | "info" }) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    width: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 3,
    border: `1px solid ${colors.borderStrong}`,
    fontSize: kind === "call" ? 9 : 10,
    borderRadius: kind === "call" ? 3 : "50%",
    backgroundColor: colors.surface200,
    color: kind === "info" ? colors.muted : colors.accent,
  };

  return (
    <span style={base}>
      {kind === "call" ? "▶" : kind === "ok" ? "✓" : "◦"}
    </span>
  );
}

function FaviconTile({
  site,
  active,
}: {
  site: DemoSite;
  active: boolean;
}) {
  return (
    <span
      style={{
        display: "flex",
        height: 22,
        width: 22,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 600,
        color: site.brandColor,
        backgroundColor: active
          ? `color-mix(in srgb, ${site.brandColor} 22%, transparent)`
          : colors.surface300,
      }}
    >
      {site.url.charAt(0).toUpperCase()}
    </span>
  );
}

function PreviewArea({
  surface,
  site,
  visibleSteps,
  done,
}: {
  surface: SurfaceId;
  site: DemoSite;
  visibleSteps: number;
  done: boolean;
}) {
  if (surface === "web") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "14px 16px",
          fontSize: 13,
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              maxWidth: "78%",
              borderRadius: 10,
              borderBottomRightRadius: 4,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface200,
              padding: "10px 12px",
              color: colors.foreground,
            }}
          >
            Extract the design system from{" "}
            <span style={{ fontFamily: fontMono, color: colors.accent }}>
              {site.url}
            </span>
          </div>
        </div>
        {visibleSteps >= 2 ? (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                maxWidth: "86%",
                borderRadius: 10,
                borderBottomLeftRadius: 4,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface100,
                padding: "10px 12px",
                color: colors.muted,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: colors.subtle,
                }}
              >
                ## Visual Theme
              </div>
              <div style={{ marginTop: 6, color: colors.foreground }}>
                {site.theme}.
              </div>
            </div>
          </div>
        ) : null}
        {visibleSteps >= 5 ? (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                maxWidth: "86%",
                borderRadius: 10,
                borderBottomLeftRadius: 4,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface100,
                padding: "10px 12px",
                color: colors.muted,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: colors.subtle,
                }}
              >
                ## Palette
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {site.palette.map((hex) => (
                  <div
                    key={hex}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface200,
                      padding: "4px 8px",
                      fontFamily: fontMono,
                      fontSize: 11,
                      color: colors.muted,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        border: `1px solid ${colors.borderStrong}`,
                        backgroundColor: hex,
                      }}
                    />
                    {hex}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        {done ? (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                maxWidth: "86%",
                borderRadius: 10,
                borderBottomLeftRadius: 4,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface100,
                padding: "10px 12px",
                color: colors.muted,
              }}
            >
              <div style={{ color: colors.foreground }}>
                design.md ready ·{" "}
                <span style={{ color: colors.accent }}>9 sections</span>,
                grounded in actual CSS.
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: fontMono,
                  fontSize: 11,
                  color: colors.subtle,
                }}
              >
                {site.sections.join(" · ")} · +5 more
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (surface === "api") {
    return (
      <div
        style={{
          padding: "14px 16px",
          fontFamily: fontMono,
          fontSize: 12.5,
          lineHeight: 1.55,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: colors.subtle,
          }}
        >
          request
        </div>
        <pre
          style={{
            margin: "8px 0 0",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface200,
            padding: 12,
            color: colors.foreground,
          }}
        >
          <span style={{ color: COL.key }}>GET</span>{" "}
          <span style={{ color: COL.str }}>
            https://api.getdesign.app/?url={site.url}
          </span>
          {"\n"}
          <span style={{ color: COL.com }}>Accept: text/markdown</span>
        </pre>
        {visibleSteps >= 2 ? (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: colors.subtle,
              }}
            >
              response
              <span
                style={{
                  borderRadius: 3,
                  border: `1px solid ${colors.borderStrong}`,
                  padding: "1px 6px",
                  fontSize: 9.5,
                  color: colors.accent,
                }}
              >
                {done ? "200 OK" : "200 streaming"}
              </span>
            </div>
            <pre
              style={{
                margin: "8px 0 0",
                whiteSpace: "pre-wrap",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface200,
                padding: 12,
                color: colors.muted,
              }}
            >
              <span style={{ color: COL.com }}># {site.url}</span>
              {"\n\n"}
              <span style={{ color: COL.key }}>## Visual Theme</span>
              {"\n"}
              <span style={{ color: colors.foreground }}>{site.theme}.</span>
            </pre>
          </div>
        ) : null}
      </div>
    );
  }

  if (surface === "cli") {
    return (
      <div
        style={{
          backgroundColor: colors.background,
          padding: "14px 16px",
          fontFamily: fontMono,
          fontSize: 12.5,
          lineHeight: 1.55,
        }}
      >
        <div>
          <span style={{ color: colors.accent }}>$</span>{" "}
          <span style={{ color: colors.foreground }}>
            npx @getdesign/cli {site.url}
          </span>
        </div>
        {visibleSteps >= 1 ? (
          <div style={{ marginTop: 8, color: colors.muted }}>
            <span style={{ color: COL.com }}>
              ↳ getdesign · streaming to stdout
            </span>
          </div>
        ) : null}
        {visibleSteps >= 2 ? (
          <div style={{ marginTop: 10, color: colors.muted }}>
            <span style={{ color: COL.com }}>✓</span> crawled html + 4
            stylesheets
            <span style={{ color: colors.subtle }}> 128ms</span>
          </div>
        ) : null}
        {visibleSteps >= 4 ? (
          <div style={{ color: colors.muted }}>
            <span style={{ color: COL.com }}>✓</span> screenshot 1440×900
            <span style={{ color: colors.subtle }}> hero.png</span>
          </div>
        ) : null}
        {done ? (
          <pre
            style={{
              margin: "12px 0 0",
              whiteSpace: "pre-wrap",
              color: colors.foreground,
            }}
          >
            <span style={{ color: COL.key }}># {site.url}</span>
            {"\n"}
            <span style={{ color: colors.muted }}>## Visual Theme{"\n"}</span>
            {site.theme}.
          </pre>
        ) : null}
      </div>
    );
  }

  if (surface === "sdk") {
    return (
      <div
        style={{
          padding: "14px 16px",
          fontFamily: fontMono,
          fontSize: 12.5,
          lineHeight: 1.55,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: colors.subtle,
          }}
        >
          app.ts
        </div>
        <pre
          style={{
            margin: "8px 0 0",
            whiteSpace: "pre-wrap",
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface200,
            padding: 12,
            color: colors.foreground,
          }}
        >
          <span style={{ color: COL.key }}>import</span> {"{ streamDesign }"}{" "}
          <span style={{ color: COL.key }}>from</span>{" "}
          <span style={{ color: COL.str }}>&quot;@getdesign/sdk&quot;</span>;
          {"\n\n"}
          <span style={{ color: COL.key }}>for await</span> (const ev of{" "}
          <span style={{ color: COL.fn }}>streamDesign</span>(
          <span style={{ color: COL.str }}>&quot;{site.url}&quot;</span>)) {"{"}
          {"\n"}
          {"  "}…
          {"\n"}
          {"}"}
        </pre>
        {visibleSteps >= 3 ? (
          <div
            style={{
              marginTop: 16,
              fontSize: 11,
              color: colors.muted,
            }}
          >
            Events: <Tx c="str">phase</Tx>, <Tx c="str">screenshot</Tx>,{" "}
            <Tx c="str">tokens</Tx>, <Tx c="str">delta</Tx>, <Tx c="str">done</Tx>
          </div>
        ) : null}
      </div>
    );
  }

  /* skill */
  return (
    <div
      style={{
        padding: "14px 16px",
        fontFamily: fontMono,
        fontSize: 12.5,
        lineHeight: 1.55,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: colors.subtle,
        }}
      >
        install
      </div>
      <pre
        style={{
          margin: "8px 0 0",
          whiteSpace: "pre-wrap",
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface200,
          padding: 12,
          color: colors.foreground,
        }}
      >
        <span style={{ color: colors.accent }}>$</span> npx skills add
        MohtashamMurshid/getdesign{"\n"}
        <span style={{ color: COL.com }}>
          ✓ SKILL.md → Claude · Codex · Cursor
        </span>
      </pre>
      {visibleSteps >= 1 ? (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: colors.subtle,
            }}
          >
            agent prompt
          </div>
          <div
            style={{
              marginTop: 8,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface200,
              padding: 12,
              color: colors.muted,
            }}
          >
            <span style={{ color: colors.foreground }}>
              extract the design system from {site.url}
            </span>
          </div>
        </div>
      ) : null}
      {visibleSteps >= 2 ? (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface100,
            color: colors.muted,
            fontSize: 12,
          }}
        >
          Uses your IDE agent + tools; same nine-section design.md contract.
        </div>
      ) : null}
    </div>
  );
}

function inputHint(surface: SurfaceId, site: DemoSite): string {
  switch (surface) {
    case "web":
      return `ask a follow-up about ${site.url}…`;
    case "api":
      return `curl api.getdesign.app/?url=${site.url}`;
    case "cli":
      return `npx @getdesign/cli ${site.url}`;
    case "sdk":
      return `streamDesign("${site.url}")`;
    case "skill":
      return "npx skills add MohtashamMurshid/getdesign";
    default:
      return "";
  }
}

function inputGlyph(surface: SurfaceId): string {
  if (surface === "web") {
    return "›";
  }
  if (surface === "cli" || surface === "skill") {
    return "$";
  }
  return "•";
}

export function HowItWorksDashboard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tracePhaseEnd = msToFrames(7800, fps);
  const stepStart = msToFrames(280, fps);
  const stepEvery = msToFrames(620, fps);

  const visibleSteps =
    frame < tracePhaseEnd
      ? Math.min(
          8,
          Math.max(0, Math.floor((frame - stepStart) / stepEvery) + 1),
        )
      : 8;

  const done = visibleSteps >= 8;
  const site =
    DEMO_SITES.find((s) => s.id === DEFAULT_DEMO_SITE_ID) ?? DEMO_SITES[2]!;
  const steps = makeBackendSteps(site.url);

  const surfacePhaseFrame = Math.max(0, frame - tracePhaseEnd);
  const surfaceTour =
    frame >= tracePhaseEnd
      ? (Math.min(
          4,
          Math.floor(surfacePhaseFrame / msToFrames(1650, fps)),
        ) as number)
      : 0;

  const activeSurface: SurfaceId =
    frame < tracePhaseEnd ? "web" : SURFACE_NAV[surfaceTour]!.id;

  const explain = SURFACE_ARCHITECTURE[activeSurface];
  const tourEnter = interpolate(
    surfacePhaseFrame,
    [0, msToFrames(320, fps)],
    [0, 1],
    {
      easing: standardEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const headerPulse = interpolate(
    frame % Math.round(1.4 * fps),
    [0, Math.round(0.7 * fps), Math.round(1.4 * fps)],
    [1, 0.35, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const previewVisibleSteps = frame < tracePhaseEnd ? visibleSteps : 8;
  const previewDone = frame < tracePhaseEnd ? done : true;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100%",
        fontFamily: fontSans,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.65fr) minmax(0, 1fr)",
          gap: 18,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface100,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.surface200,
              padding: "10px 12px",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
                <span
                  key={c}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: c,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                flex: 1,
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                padding: "6px 12px",
                textAlign: "center",
                fontFamily: fontMono,
                fontSize: 11.5,
                color: colors.subtle,
              }}
            >
              {chromeLabel(activeSurface, site.url)}
            </div>
            <div
              style={{
                width: 48,
                textAlign: "right",
                fontFamily: fontMono,
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: colors.subtle,
              }}
            >
              {activeSurface}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "200px minmax(0, 1fr)",
              flex: 1,
              minHeight: 440,
            }}
          >
            <div
              style={{
                overflow: "hidden",
                borderRight: `1px solid ${colors.border}`,
                padding: 12,
              }}
            >
              <div
                style={{
                  padding: "4px 6px 8px",
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: colors.subtle,
                }}
              >
                Try a URL
              </div>
              {DEMO_SITES.map((s) => {
                const isActive = s.id === site.id;
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 4,
                      borderRadius: 6,
                      border: `1px solid ${
                        isActive ? colors.borderStrong : "transparent"
                      }`,
                      backgroundColor: isActive
                        ? colors.surface200
                        : "transparent",
                      padding: "8px 10px",
                      fontFamily: fontMono,
                      fontSize: 12.5,
                      color: isActive ? colors.foreground : colors.muted,
                    }}
                  >
                    <FaviconTile site={s} active={isActive} />
                    {s.url}
                  </div>
                );
              })}
              <div
                style={{
                  marginTop: 8,
                  borderRadius: 6,
                  border: `1px dashed ${colors.borderStrong}`,
                  padding: "8px 10px",
                  fontSize: 11.5,
                  color: colors.subtle,
                }}
              >
                or paste any URL…
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: "4px 6px 8px",
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: colors.subtle,
                }}
              >
                Surfaces
              </div>
              {SURFACE_NAV.map((entry) => {
                const isActive = entry.id === activeSurface;
                return (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                      borderRadius: 6,
                      border: `1px solid ${
                        isActive ? colors.borderStrong : "transparent"
                      }`,
                      backgroundColor: isActive
                        ? colors.surface200
                        : "transparent",
                      padding: "6px 10px",
                      fontFamily: fontMono,
                      fontSize: 12,
                      color: isActive ? colors.foreground : colors.muted,
                    }}
                  >
                    <span>· {entry.label}</span>
                    {isActive ? (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: colors.accent,
                        }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                minHeight: 0,
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${colors.border}`,
                  padding: "10px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: colors.accent,
                      opacity: previewDone ? 1 : headerPulse,
                    }}
                  />
                  <span style={{ color: colors.muted }}>
                    {previewDone ? "ready" : "extracting"}
                  </span>
                  <span style={{ color: colors.subtle }}>·</span>
                  <span
                    style={{ fontFamily: fontMono, color: colors.subtle }}
                  >
                    {site.url}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: colors.subtle }}>
                  design.md
                </span>
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <PreviewArea
                  surface={activeSurface}
                  site={site}
                  visibleSteps={previewVisibleSteps}
                  done={previewDone}
                />
              </div>

              <div
                style={{
                  borderTop: `1px solid ${colors.border}`,
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.surface200,
                    padding: "8px 12px",
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ color: colors.accent }}>
                    {inputGlyph(activeSurface)}
                  </span>
                  <span style={{ color: colors.subtle, flex: 1 }}>
                    {inputHint(activeSurface, site)}
                  </span>
                  <span
                    style={{
                      fontFamily: fontMono,
                      fontSize: 10.5,
                      color: colors.subtle,
                    }}
                  >
                    {previewVisibleSteps}/{steps.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface100,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${colors.border}`,
              padding: "10px 16px",
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: colors.subtle,
              }}
            >
              Backend
            </div>
            <div
              style={{ fontFamily: fontMono, fontSize: 10.5, color: colors.subtle }}
            >
              agent.run
            </div>
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              padding: 16,
              fontFamily: fontMono,
              fontSize: 12,
              lineHeight: 1.55,
            }}
          >
            {steps.slice(0, visibleSteps).map((step, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 14,
                  color:
                    step.kind === "ok" || step.kind === "info"
                      ? colors.muted
                      : colors.foreground,
                }}
              >
                <StepGlyph kind={step.kind} />
                <div>{step.node}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              backgroundColor: colors.surface200,
              padding: "8px 12px",
              fontSize: 11.5,
            }}
          >
            {done ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontFamily: fontMono, color: colors.muted }}>
                  <span style={{ color: COL.num }}>200</span> OK ·{" "}
                  <span style={{ color: COL.num }}>8.2s</span> · 14.3KB
                </span>
                <span style={{ color: colors.accent }}>replay ↻</span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: colors.subtle,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: colors.accent,
                    opacity: headerPulse,
                  }}
                />
                <span style={{ fontFamily: fontMono }}>thinking…</span>
                <span style={{ marginLeft: "auto", fontFamily: fontMono, fontSize: 10.5 }}>
                  {visibleSteps}/{steps.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface100,
          padding: "16px 20px",
          opacity: frame >= tracePhaseEnd ? tourEnter : 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 12,
                color: colors.accent,
                marginBottom: 6,
              }}
            >
              {frame >= tracePhaseEnd
                ? `Surface · ${activeSurface}`
                : "Agent pipeline"}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              {frame >= tracePhaseEnd
                ? explain.headline
                : "One coordinator, four specialist agents"}
            </div>
            {(frame >= tracePhaseEnd ? explain.bullets : [...AGENT_LAYERS]).map(
              (line, i) => (
                <p
                  key={i}
                  style={{
                    margin: i === 0 ? 0 : "6px 0 0",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: colors.muted,
                  }}
                >
                  {line}
                </p>
              ),
            )}
          </div>
          <div
            style={{
              width: 280,
              flexShrink: 0,
              borderRadius: 8,
              border: `1px dashed ${colors.accent}44`,
              padding: "12px 14px",
              backgroundColor: colors.surface200,
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: colors.subtle,
                marginBottom: 8,
              }}
            >
              Same core
            </div>
            <div style={{ fontSize: 12.5, color: colors.muted, lineHeight: 1.5 }}>
              Web, API, CLI, and SDK call the shared agent package — only the
              transport changes. Skill runs inside your IDE agent with the same
              nine-section contract.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
