import type { APIRoute } from "astro";

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "GoogleOther",
  "Applebot-Extended",
  "Bytespider",
  "Amazonbot",
  "CCBot",
  "cohere-ai",
  "DuckAssistBot",
  "FacebookBot",
  "Meta-ExternalAgent",
  "MistralAI-User",
  "YouBot",
];

export const GET: APIRoute = ({ site }) => {
  const origin = site?.toString().replace(/\/$/, "") ?? "https://docs.getdesign.app";

  const lines: string[] = [];
  lines.push("User-agent: *");
  lines.push("Allow: /");
  lines.push("");

  for (const bot of AI_CRAWLERS) {
    lines.push(`User-agent: ${bot}`);
    lines.push("Allow: /");
    lines.push("");
  }

  lines.push(`Sitemap: ${origin}/sitemap-index.xml`);
  lines.push(`Host: ${origin}`);

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
