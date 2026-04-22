import { colors } from "../design-tokens";
import { fontMono, fontSans } from "../fonts";

export function BrowserChrome({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${colors.borderStrong}`,
        backgroundColor: colors.surface100,
        boxShadow: `0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px ${colors.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          backgroundColor: colors.surface200,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span
              key={c}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: c,
                opacity: 0.85,
              }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            marginLeft: 8,
            borderRadius: 8,
            padding: "8px 12px",
            backgroundColor: colors.surface300,
            border: `1px solid ${colors.border}`,
            fontFamily: fontMono,
            fontSize: 13,
            color: colors.subtle,
          }}
        >
          <span style={{ color: colors.muted }}>{url}</span>
        </div>
      </div>
      <div style={{ fontFamily: fontSans }}>{children}</div>
    </div>
  );
}

/** Abstract “landing page” hero blocks inside the browser. */
export function FakeLandingPage() {
  return (
    <div style={{ padding: 28, backgroundColor: colors.background }}>
      <div
        style={{
          height: 18,
          width: "42%",
          borderRadius: 6,
          background: `linear-gradient(90deg, ${colors.surface300}, ${colors.surface200})`,
          marginBottom: 20,
        }}
      />
      <div
        style={{
          height: 36,
          width: "78%",
          borderRadius: 8,
          background: `linear-gradient(90deg, ${colors.foreground}22, ${colors.subtle}33)`,
          marginBottom: 16,
        }}
      />
      <div
        style={{
          height: 14,
          width: "55%",
          borderRadius: 6,
          backgroundColor: colors.surface300,
          marginBottom: 28,
        }}
      />
      <div style={{ display: "flex", gap: 12 }}>
        <div
          style={{
            height: 40,
            width: 120,
            borderRadius: 8,
            backgroundColor: colors.foreground,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            height: 40,
            width: 120,
            borderRadius: 8,
            border: `1px solid ${colors.borderStrong}`,
            backgroundColor: colors.surface200,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 88,
              borderRadius: 10,
              background: `linear-gradient(145deg, ${colors.surface200}, ${colors.surface300})`,
              border: `1px solid ${colors.border}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
