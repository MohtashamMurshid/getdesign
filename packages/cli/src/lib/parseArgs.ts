export type CliOptions = {
  help?: boolean;
  version?: boolean;
  url?: string;
  siteName?: string;
  out?: string;
  daytonaApiKey?: string;
  openaiApiKey?: string;
  visualRequirement: "require" | "text_only_fallback";
};

export function usage(): string {
  return `getdesign — generate a design.md from any public URL

Usage:
  getdesign <url> [options]
  getdesign --url <url> [options]

Options:
  --url <url>                 Source URL to analyze
  --site-name <name>          Override the detected site name
  --out <path>                Output file or directory (default: ./getdesign-runs/<slug>/design.md)
  --daytona-api-key <key>     Daytona key for this run (or DAYTONA_API_KEY)
  --openai-api-key <key>      OpenAI key for this run (or OPENAI_API_KEY)
  --text-only-fallback        Continue if visual capture is unavailable
  --help, -h                  Show help
  --version, -v               Show version

Examples:
  getdesign https://linear.app
  getdesign https://linear.app --out design.md
  getdesign --url https://cursor.com --site-name Cursor --out ./designs
  DAYTONA_API_KEY=... OPENAI_API_KEY=... getdesign https://example.com
`;
}

function takeValue(tokens: string[], index: number, flag: string): string {
  const value = tokens[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

/**
 * Parse CLI argv (excluding node/bun and script path). Throws on unknown flags or duplicate URL.
 */
export function parseArgs(tokens: string[]): CliOptions {
  const options: CliOptions = {
    visualRequirement: "require",
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token) continue;

    if (token === "--help" || token === "-h") options.help = true;
    else if (token === "--version" || token === "-v") options.version = true;
    else if (token === "--text-only-fallback") {
      options.visualRequirement = "text_only_fallback";
    } else if (token === "--url") {
      options.url = takeValue(tokens, i, token);
      i += 1;
    } else if (token === "--site-name") {
      options.siteName = takeValue(tokens, i, token);
      i += 1;
    } else if (token === "--out") {
      options.out = takeValue(tokens, i, token);
      i += 1;
    } else if (token === "--daytona-api-key") {
      options.daytonaApiKey = takeValue(tokens, i, token);
      i += 1;
    } else if (token === "--openai-api-key") {
      options.openaiApiKey = takeValue(tokens, i, token);
      i += 1;
    } else if (token.startsWith("-")) {
      throw new Error(`Unknown option: ${token}`);
    } else if (!options.url) {
      options.url = token;
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }

  return options;
}
