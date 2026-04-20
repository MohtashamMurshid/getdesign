export default function PipelineSVG() {
  return (
    <svg
      viewBox="0 0 800 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="getdesign pipeline: a browser is scanned, design tokens are extracted, and a design.md document is assembled."
      className="w-full h-auto"
    >
      <title>URL → tokens → design.md</title>

      <defs>
        {/* Dashed flow line that continuously slides */}
        <style>{`
          .flow { stroke-dasharray: 6 8; animation: flow 2.4s linear infinite; }
          @keyframes flow { to { stroke-dashoffset: -28; } }

          .scanline { animation: scan 3.2s ease-in-out infinite; }
          @keyframes scan {
            0%, 100% { transform: translateY(8px); opacity: 0; }
            10% { opacity: 1; }
            50% { transform: translateY(140px); opacity: 1; }
            90% { opacity: 0; }
          }

          .token { transform-box: fill-box; transform-origin: center; }
          .token-a { animation: fly-a 3.2s ease-in-out infinite; }
          .token-b { animation: fly-b 3.2s ease-in-out infinite; animation-delay: .35s; }
          .token-c { animation: fly-c 3.2s ease-in-out infinite; animation-delay: .7s; }
          .token-d { animation: fly-d 3.2s ease-in-out infinite; animation-delay: 1.05s; }

          @keyframes fly-a {
            0%, 20% { opacity: 0; transform: translate(0, 0); }
            35% { opacity: 1; }
            70% { opacity: 1; transform: translate(250px, -60px); }
            100% { opacity: 0; transform: translate(260px, -62px); }
          }
          @keyframes fly-b {
            0%, 20% { opacity: 0; transform: translate(0, 0); }
            35% { opacity: 1; }
            70% { opacity: 1; transform: translate(250px, -20px); }
            100% { opacity: 0; transform: translate(260px, -22px); }
          }
          @keyframes fly-c {
            0%, 20% { opacity: 0; transform: translate(0, 0); }
            35% { opacity: 1; }
            70% { opacity: 1; transform: translate(250px, 20px); }
            100% { opacity: 0; transform: translate(260px, 22px); }
          }
          @keyframes fly-d {
            0%, 20% { opacity: 0; transform: translate(0, 0); }
            35% { opacity: 1; }
            70% { opacity: 1; transform: translate(250px, 60px); }
            100% { opacity: 0; transform: translate(260px, 62px); }
          }

          .row-draw {
            stroke-dasharray: 180;
            stroke-dashoffset: 180;
            animation: draw 3.2s ease-in-out infinite;
          }
          @keyframes draw { 50% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }

          .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
          @keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }

          .cursor-blink { animation: blink 1s steps(1) infinite; }
          @keyframes blink { 50% { opacity: 0; } }
        `}</style>
      </defs>

      {/* Left: browser window being scanned */}
      <g transform="translate(40, 80)">
        {/* Window frame */}
        <rect
          x="0"
          y="0"
          width="260"
          height="200"
          rx="10"
          fill="#0a0a0a"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
        />
        {/* Title bar */}
        <rect
          x="0"
          y="0"
          width="260"
          height="28"
          rx="10"
          fill="#111"
          stroke="rgba(255,255,255,0.07)"
        />
        <circle cx="14" cy="14" r="3" fill="rgba(255,255,255,0.18)" />
        <circle cx="26" cy="14" r="3" fill="rgba(255,255,255,0.18)" />
        <circle cx="38" cy="14" r="3" fill="rgba(255,255,255,0.18)" />
        {/* URL bar */}
        <rect
          x="58"
          y="7"
          width="190"
          height="14"
          rx="3"
          fill="#000"
          stroke="rgba(255,255,255,0.07)"
        />
        <text
          x="64"
          y="17"
          fontFamily="ui-monospace, monospace"
          fontSize="8.5"
          fill="rgba(237,237,237,0.55)"
        >
          https://cursor.com
          <tspan className="cursor-blink" fill="#34e5a1">
            {" "}
            ▍
          </tspan>
        </text>

        {/* Page content lines */}
        <g stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeLinecap="round">
          <line x1="20" y1="54" x2="140" y2="54" />
          <line x1="20" y1="66" x2="110" y2="66" />
          <rect
            x="20"
            y="82"
            width="220"
            height="48"
            rx="4"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.08)"
          />
          <line x1="20" y1="144" x2="180" y2="144" />
          <line x1="20" y1="156" x2="120" y2="156" />
          <line x1="20" y1="168" x2="200" y2="168" />
          <line x1="20" y1="180" x2="90" y2="180" />
        </g>

        {/* Scanline */}
        <g className="scanline">
          <line
            x1="6"
            y1="40"
            x2="254"
            y2="40"
            stroke="#34e5a1"
            strokeWidth="1"
            opacity="0.9"
          />
          <rect x="6" y="40" width="248" height="14" fill="#34e5a1" opacity="0.06" />
        </g>
      </g>

      {/* Middle: flow lines + tokens */}
      <g>
        {/* Four dashed flow paths from browser edge to doc edge */}
        <g
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1"
          fill="none"
          className="flow"
        >
          <path d="M 300 120 C 370 120, 430 120, 500 120" />
          <path d="M 300 160 C 370 160, 430 160, 500 160" />
          <path d="M 300 200 C 370 200, 430 200, 500 200" />
          <path d="M 300 240 C 370 240, 430 240, 500 240" />
        </g>

        {/* Tokens flying across */}
        <g className="token token-a">
          <circle cx="300" cy="180" r="5" fill="#34e5a1" />
        </g>
        <g className="token token-b">
          <rect x="295" y="175" width="10" height="10" rx="2" fill="#ededed" />
        </g>
        <g className="token token-c">
          <circle cx="300" cy="180" r="5" fill="#ededed" />
        </g>
        <g className="token token-d">
          <rect x="295" y="175" width="10" height="10" rx="2" fill="#34e5a1" />
        </g>
      </g>

      {/* Right: design.md document being written */}
      <g transform="translate(500, 60)">
        <rect
          x="0"
          y="0"
          width="260"
          height="240"
          rx="10"
          fill="#0a0a0a"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
        />
        <rect
          x="0"
          y="0"
          width="260"
          height="28"
          rx="10"
          fill="#111"
          stroke="rgba(255,255,255,0.07)"
        />
        <text
          x="14"
          y="18"
          fontFamily="ui-monospace, monospace"
          fontSize="10"
          fill="rgba(237,237,237,0.55)"
        >
          design.md
        </text>
        <circle cx="244" cy="14" r="3" fill="#34e5a1" className="pulse" />

        {/* Markdown heading */}
        <text
          x="18"
          y="58"
          fontFamily="ui-monospace, monospace"
          fontSize="11"
          fill="#ededed"
        >
          # Design System
        </text>

        {/* Section rows drawn in sequence */}
        <g
          stroke="rgba(237,237,237,0.5)"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        >
          <line
            x1="18"
            y1="80"
            x2="198"
            y2="80"
            className="row-draw"
            style={{ animationDelay: "0s" }}
          />
          <line
            x1="18"
            y1="96"
            x2="158"
            y2="96"
            className="row-draw"
            style={{ animationDelay: "0.2s" }}
          />
          <line
            x1="18"
            y1="120"
            x2="198"
            y2="120"
            className="row-draw"
            style={{ animationDelay: "0.5s" }}
          />
          <line
            x1="18"
            y1="136"
            x2="138"
            y2="136"
            className="row-draw"
            style={{ animationDelay: "0.7s" }}
          />
          <line
            x1="18"
            y1="160"
            x2="198"
            y2="160"
            className="row-draw"
            style={{ animationDelay: "1s" }}
          />
          <line
            x1="18"
            y1="176"
            x2="108"
            y2="176"
            className="row-draw"
            style={{ animationDelay: "1.2s" }}
          />
        </g>

        {/* Color swatch row */}
        <g transform="translate(18, 198)">
          <rect width="14" height="14" rx="2" fill="#26251e" stroke="rgba(255,255,255,0.14)" />
          <rect x="18" width="14" height="14" rx="2" fill="#f2f1ed" />
          <rect x="36" width="14" height="14" rx="2" fill="#f54e00" />
          <rect x="54" width="14" height="14" rx="2" fill="#cf2d56" />
          <rect
            x="72"
            width="14"
            height="14"
            rx="2"
            fill="transparent"
            stroke="rgba(255,255,255,0.14)"
            strokeDasharray="2 2"
          />
        </g>
      </g>
    </svg>
  );
}
