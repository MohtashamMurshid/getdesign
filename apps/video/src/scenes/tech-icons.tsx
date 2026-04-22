import type { ReactElement, SVGProps } from "react";

const iconBase: SVGProps<SVGSVGElement> = {
  width: 36,
  height: 36,
  viewBox: "0 0 24 24",
  role: "img",
};

/** Recognizable brand marks (official colors). Paths are simplified or geometric where full SI paths aren’t inlined. */

export function IconVercel(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Vercel">
      <path fill="#FFFFFF" d="M12 1L24 22H0z" />
    </svg>
  );
}

export function IconReact(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} viewBox="0 0 24 24" aria-label="React">
      <g stroke="#61DAFB" strokeWidth="1.1" fill="none">
        <ellipse cx="12" cy="12" rx="10.5" ry="4.1" />
        <ellipse
          cx="12"
          cy="12"
          rx="10.5"
          ry="4.1"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10.5"
          ry="4.1"
          transform="rotate(120 12 12)"
        />
      </g>
      <circle cx="12" cy="12" r="1.7" fill="#61DAFB" />
    </svg>
  );
}

export function IconNextJs(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Next.js">
      <rect width="24" height="24" rx="5" fill="#000000" />
      <path
        fill="#FFFFFF"
        d="M11.2 6.8h2.1l4.9 10.4h-2.1l-1.1-3.1-2.1-3.5-2 3.5-1.1 3.1H7.8l4.4-10.4z"
      />
    </svg>
  );
}

export function IconTypeScript(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="TypeScript">
      <rect width="24" height="24" rx="3" fill="#3178C6" />
      <path
        fill="#FFFFFF"
        d="M14.5 11.2V10h-5v8h1.4v-3.1h2.8c1.2 0 2.1-.3 2.7-.9.6-.6.9-1.4.9-2.4 0-1-.3-1.8-.9-2.3-.6-.6-1.4-.9-2.4-.9zm-.2 3.6h-2.1v-2.6h2c.5 0 .9.1 1.1.4.2.3.4.6.4 1s-.1.7-.4.9c-.3.2-.7.3-1.2.3z"
      />
    </svg>
  );
}

export function IconBun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Bun">
      <circle cx="12" cy="12" r="11" fill="#14151a" />
      <ellipse cx="12" cy="13" rx="6" ry="7" fill="#fbf0df" />
      <ellipse cx="9.5" cy="11" rx="1.1" ry="1.4" fill="#14151a" />
      <ellipse cx="14.5" cy="11" rx="1.1" ry="1.4" fill="#14151a" />
      <path
        d="M10 15q2 1.5 4 0"
        stroke="#14151a"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconTailwind(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Tailwind CSS">
      <path
        fill="#06B6D4"
        d="M12 6c-2.5 0-4 1.25-4 3.25 0 2.5 2.5 2.75 2.5 4.25 0 1-1 1.75-2.75 1.75-1.6 0-2.75-.75-3.25-1.75.5 2.25 2.25 3.5 5 3.5 3 0 5-1.5 5-4 0-2.75-3-3-3-4.5 0-.9.65-1.5 2.5-1.5 1.35 0 2.35.55 2.85 1.4C18.2 7.2 15.6 6 12 6z"
      />
    </svg>
  );
}

export function IconTurborepo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Turborepo">
      <path
        fill="#EF4444"
        d="M12 2L22 7v10l-10 5L2 17V7l10-5zm0 2.2L4.5 8.3v7.4L12 19.8l7.5-4.1V8.3L12 4.2zm0 3.3l4.5 2.5v5L12 17.5l-4.5-2.5v-5L12 7.5z"
      />
    </svg>
  );
}

export function IconHono(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Hono">
      <path
        fill="#FF5B13"
        d="M12 3c-4 2-6.5 5.5-7 9.5.8 4.2 4 7.5 7 8.5 3-1 6.2-4.3 7-8.5-.5-4-3-7.5-7-9.5zm0 3.2c2.2 1.2 3.8 3.4 4.2 6-.4 2.8-2 5-4.2 6.2-2.2-1.2-3.8-3.4-4.2-6.2.4-2.6 2-4.8 4.2-6z"
      />
    </svg>
  );
}

export function IconConvex(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Convex">
      <rect width="24" height="24" rx="6" fill="#F3F4F6" />
      <path
        fill="#4B5563"
        d="M8 8h8v2.2H10.4V12H16v2.2H10.4V16H8V8z"
      />
    </svg>
  );
}

export function IconOpenAI(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="OpenAI">
      <path
        fill="#FFFFFF"
        d="M21.5 10.2c.2-1.4-.1-2.8-.9-4-.9-1.3-2.3-2.2-3.9-2.5-1.1-.2-2.2 0-3.2.5-.6-1.7-2-3-3.8-3.5-2.4-.7-5 .3-6.2 2.5-.8 1.3-1 2.9-.6 4.4-1.5.9-2.5 2.5-2.7 4.3-.2 2.4 1.1 4.7 3.3 5.7-.2 1.4.1 2.8.9 4 1.8 2.6 5.4 3.3 8 1.6.9.5 2 .8 3.1.7 2.5-.2 4.5-2.2 4.8-4.7 1.4-.8 2.4-2.2 2.6-3.9.3-2.3-.9-4.5-3-5.6zm-6.8 8.1c-.9 0-1.7-.2-2.4-.6l.1-.1 2-1.1c.2-.1.3-.3.3-.5v-4.8l.8.5c.1 0 .1.1.1.2v4c0 1.8-1.5 3.3-3.3 3.4h-.3zm-7-3c-.4-.7-.6-1.5-.5-2.3l.1.1 2 1.1c.2.1.4.1.6 0l3.5-2v1c0 .1 0 .2-.1.2l-2.9 1.7c-.8.4-1.8.5-2.7.2zm-.9-7.5c.4-.7 1-1.2 1.7-1.6v4.1c0 .2.1.4.3.5l3.5 2-.9.5c-.1.1-.2.1-.3 0l-2.9-1.7c-1.5-.9-2.2-2.8-1.8-4.5l.4.7zm9.6 2.2L9.4 9.9l.9-.5c.1-.1.2-.1.3 0l2.9 1.7c1.5.9 2 2.8 1.3 4.3l-2-1.1c-.2-.1-.4-.1-.6 0l-3.5-2zm3.4-5.5c.9 0 1.7.2 2.4.6l-.1.1-2 1.1c-.2.1-.3.3-.3.5v4.8l-.8-.5c-.1 0-.1-.1-.1-.2v-4c0-1.8 1.4-3.3 3.2-3.4h.7z"
      />
    </svg>
  );
}

export function IconZod(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Zod">
      <rect width="24" height="24" rx="5" fill="#3068B7" />
      <path
        fill="#FFFFFF"
        d="M7 7h6l-2.2 3.2L16 17H10l2.5-3.8L7 7z"
      />
    </svg>
  );
}

export function IconChromium(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Chromium">
      <circle cx="12" cy="12" r="10" fill="#4285F4" />
      <path
        fill="#FFFFFF"
        opacity="0.9"
        d="M12 6.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z"
      />
      <circle cx="12" cy="12" r="2" fill="#F4B400" />
    </svg>
  );
}

export function IconDaytona(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Daytona">
      <rect width="24" height="24" rx="5" fill="#0F172A" />
      <path
        fill="#38BDF8"
        d="M6 16c2-4 4-7 6-9 2 2 4 5 6 9-2-1-4-1.5-6-1.5S8 15 6 16z"
      />
      <circle cx="12" cy="9" r="1.6" fill="#F8FAFC" />
    </svg>
  );
}

export function IconRemotion(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="Remotion">
      <path
        fill="#F5F5F5"
        d="M4 6h6l4 6-4 6H4l4-6-4-6zm10 0h6v12h-6l3-6-3-6z"
      />
    </svg>
  );
}

export function IconAiSdk(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase} {...props} aria-label="AI SDK">
      <rect width="24" height="24" rx="5" fill="#1a1a1a" stroke="#a3e635" strokeWidth="1" />
      <path
        fill="#a3e635"
        d="M8 16V8h2.2l2.6 4.2L15.4 8H17.5v8h-2v-4.2l-2.1 3.4h-1.2L10.1 12V16H8z"
      />
    </svg>
  );
}

export type TechEntry = {
  name: string;
  detail: string;
  Icon: (p: SVGProps<SVGSVGElement>) => ReactElement;
};

export const TECH_STACK: TechEntry[] = [
  {
    name: "Next.js",
    detail: "Web · App Router · ai-elements",
    Icon: IconNextJs,
  },
  { name: "React", detail: "UI · 19", Icon: IconReact },
  { name: "TypeScript", detail: "Strict types end-to-end", Icon: IconTypeScript },
  { name: "Bun", detail: "CLI + API runtime", Icon: IconBun },
  { name: "Vercel", detail: "Web deploy · AI Gateway", Icon: IconVercel },
  { name: "Turborepo", detail: "Monorepo builds", Icon: IconTurborepo },
  { name: "AI SDK", detail: "v6 · streamText · agents", Icon: IconAiSdk },
  { name: "OpenAI", detail: "Models via gateway", Icon: IconOpenAI },
  { name: "Hono", detail: "HTTP API on Vercel", Icon: IconHono },
  { name: "Convex", detail: "Runs · messages · files", Icon: IconConvex },
  { name: "Zod", detail: "DesignDoc + tokens schema", Icon: IconZod },
  { name: "Tailwind", detail: "Marketing + design page", Icon: IconTailwind },
  { name: "Chromium", detail: "Kiosk browser in sandbox", Icon: IconChromium },
  { name: "Daytona", detail: "Computer-use · screenshots", Icon: IconDaytona },
  { name: "Remotion", detail: "This launch film", Icon: IconRemotion },
];
