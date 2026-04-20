import { ImageResponse } from "next/og";

import { PRODUCT_SURFACES, SITE_NAME } from "./_lib/site";

export const runtime = "edge";
export const alt = `${SITE_NAME} — the design system for any URL`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0b",
          color: "#ededee",
          display: "flex",
          flexDirection: "column",
          padding: "72px 88px",
          position: "relative",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        }}
      >
        {/* dashed frame rails */}
        <div
          style={{
            position: "absolute",
            top: 48,
            bottom: 48,
            left: 56,
            width: 1,
            backgroundImage:
              "linear-gradient(to bottom, rgba(237,237,238,0.12) 50%, transparent 50%)",
            backgroundSize: "1px 8px",
            backgroundRepeat: "repeat-y",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 48,
            bottom: 48,
            right: 56,
            width: 1,
            backgroundImage:
              "linear-gradient(to bottom, rgba(237,237,238,0.12) 50%, transparent 50%)",
            backgroundSize: "1px 8px",
            backgroundRepeat: "repeat-y",
          }}
        />

        {/* eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 20,
            color: "rgba(237,237,238,0.6)",
          }}
        >
          <span style={{ color: "#a3e635" }}>✦</span>
          <span>Own your design system</span>
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 80,
            fontSize: 92,
            lineHeight: 1.02,
            letterSpacing: -3.2,
            fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
            fontWeight: 500,
          }}
        >
          <span>The design system</span>
          <span>
            for any URL<span style={{ color: "#a3e635" }}>.</span>
          </span>
        </div>

        {/* footer row: mark + wordmark + surfaces */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            fontSize: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            {/* [md] mark */}
            <svg width="68" height="44" viewBox="0 0 60 40" fill="none">
              <path
                d="M11 5 L4 5 L4 35 L11 35"
                stroke="#ededee"
                strokeWidth={2.5}
                strokeLinecap="square"
              />
              <path
                d="M49 5 L56 5 L56 35 L49 35"
                stroke="#ededee"
                strokeWidth={2.5}
                strokeLinecap="square"
              />
              <text
                x={30}
                y={28}
                textAnchor="middle"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize={20}
                fontWeight={700}
                letterSpacing={-1}
                fill="#a3e635"
              >
                md
              </text>
            </svg>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontFamily:
                  "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
                fontWeight: 500,
                letterSpacing: -0.6,
              }}
            >
              <span style={{ color: "rgba(237,237,238,0.38)" }}>get</span>
              <span style={{ color: "#ededee" }}>design</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "rgba(237,237,238,0.38)",
              fontSize: 18,
            }}
          >
            {PRODUCT_SURFACES.map((surface, index) => (
              <div
                key={surface}
                style={{ display: "flex", alignItems: "center", gap: 14 }}
              >
                {index > 0 ? (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 4,
                      background: "rgba(237,237,238,0.38)",
                    }}
                  />
                ) : null}
                <span>{surface}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
