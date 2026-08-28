export function prependTextOnlyBanner(markdown: string) {
  const banner = [
    "> **Note:** This design.md was produced in text-only mode. The Daytona-based full landing page capture was unavailable for this run, so visual sections are derived from CSS tokens alone and may not reflect imagery, layout depth, or interaction polish from the live site.",
    "",
  ].join("\n");
  return `${banner}\n${markdown}`;
}
