import { ImageResponse } from "next/og";

import { PRODUCT_SURFACES } from "../_lib/site";

export const runtime = "edge";
const size = { width: 1200, height: 630 };

// An explicit route keeps the configured production image URL in preview metadata.
// Next's file-based image convention substitutes the preview deployment hostname.
export async function GET() {
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
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#a3e635">
            <path d="M10 0L13 7L20 10L13 13L10 20L7 13L0 10L7 7Z" />
          </svg>
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
            {/* Satori does not support SVG <text> nodes in OG images. */}
            <div
              style={{
                width: 68,
                height: 44,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 4,
                  top: 5,
                  bottom: 5,
                  width: 7,
                  borderTop: "2.5px solid #ededee",
                  borderBottom: "2.5px solid #ededee",
                  borderLeft: "2.5px solid #ededee",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 4,
                  top: 5,
                  bottom: 5,
                  width: 7,
                  borderTop: "2.5px solid #ededee",
                  borderBottom: "2.5px solid #ededee",
                  borderRight: "2.5px solid #ededee",
                }}
              />
              <span
                style={{
                  color: "#a3e635",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: -1,
                }}
              >
                md
              </span>
            </div>
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
