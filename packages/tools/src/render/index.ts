import {
  designDocSchema,
  type ButtonStyle,
  type ColorPaletteGroup,
  type DesignDoc,
  type TypographyHierarchyEntry,
} from "@getdesign/types";

const EOL = "\n";

function joinLines(lines: string[]): string {
  return `${lines.join(EOL).trimEnd()}${EOL}`;
}

function renderColorGroup(group: ColorPaletteGroup): string[] {
  return [
    `### ${group.heading}`,
    "| Hex | Role | Where seen |",
    "| --- | --- | --- |",
    ...group.entries.map(
      (entry) =>
        `| \`${entry.hex}\` | ${entry.role} | ${entry.whereSeen} |`,
    ),
    "",
  ];
}

function renderTypographyRow(entry: TypographyHierarchyEntry): string {
  return `| ${entry.role} | ${entry.font} | ${entry.size} | ${entry.weight} | ${entry.lineHeight} | ${entry.letterSpacing} |`;
}

function renderButton(button: ButtonStyle): string[] {
  return [
    `- **${button.variant}** — background: ${button.background}; text: ${button.textColor}; border: ${button.border}; radius: ${button.radius}; padding: ${button.padding}; hover: ${button.hoverShift}`,
  ];
}

function renderBullets(items: string[]): string[] {
  return items.map((item) => `- ${item}`);
}

export function renderDesignMd(input: DesignDoc): string {
  const doc = designDocSchema.parse(input);

  const lines: string[] = [
    `# ${doc.siteName} Design System`,
    "",
    "## 1. Visual Theme & Atmosphere",
    "",
    ...doc.visualTheme.overview,
    "",
    "### Key Characteristics",
    ...renderBullets(doc.visualTheme.keyCharacteristics),
    "",
    "## 2. Color Palette & Roles",
    "",
    doc.palette.philosophy,
    "",
    ...doc.palette.groups.flatMap(renderColorGroup),
    "### Notes",
    doc.palette.notes,
    "",
    "## 3. Typography Rules",
    "",
    doc.typography.summary,
    "",
    "### Hierarchy",
    "| Role | Font | Size | Weight | Line height | Letter spacing |",
    "| --- | --- | --- | --- | --- | --- |",
    ...doc.typography.hierarchy.map(renderTypographyRow),
    "",
    "### Principles",
    ...renderBullets(doc.typography.principles),
    "",
    "## 4. Component Stylings",
    "",
    "### Buttons",
    ...doc.components.buttons.flatMap(renderButton),
    "",
    "### Cards",
    doc.components.cards.description,
    ...renderBullets(doc.components.cards.tokens),
    "",
    "### Inputs",
    doc.components.inputs.description,
    ...renderBullets(doc.components.inputs.tokens),
    "",
    "### Navigation",
    doc.components.navigation.description,
    ...renderBullets(doc.components.navigation.tokens),
    "",
    "### Image Treatment",
    doc.components.imageTreatment.description,
    ...renderBullets(doc.components.imageTreatment.tokens),
    "",
    "### Distinctive",
    ...doc.components.distinctive.flatMap((component) => [
      `- **${component.name}** — ${component.description}`,
    ]),
    "",
    "## 5. Layout Principles",
    "",
    "### Spacing Scale",
    doc.layout.spacingScale,
    "",
    "### Grid",
    doc.layout.grid,
    "",
    "### Whitespace",
    doc.layout.whitespace,
    "",
    "### Radius Scale",
    doc.layout.radiusScale,
    "",
    "## 6. Depth & Elevation",
    "",
    "### Levels",
    "| Level | Use | Shadow |",
    "| --- | --- | --- |",
    ...doc.depth.levels.map(
      (level) => `| ${level.level} | ${level.use} | \`${level.shadow}\` |`,
    ),
    "",
    "### Philosophy",
    doc.depth.philosophy,
    "",
    "## 7. Interaction & Motion",
    "",
    "### Hover States",
    doc.interaction.hoverStates,
    "",
    "### Focus States",
    doc.interaction.focusStates,
    "",
    "### Transitions",
    doc.interaction.transitions,
    "",
    "## 8. Responsive Behavior",
    "",
    "### Breakpoints",
    "| Name | Min width | Primary changes |",
    "| --- | --- | --- |",
    ...doc.responsive.breakpoints.map(
      (breakpoint) =>
        `| ${breakpoint.name} | ${breakpoint.minWidth} | ${breakpoint.primaryChanges} |`,
    ),
    "",
    "### Touch Targets",
    doc.responsive.touchTargets,
    "",
    "### Collapsing Strategy",
    doc.responsive.collapsingStrategy,
    "",
    "### Image Behavior",
    doc.responsive.imageBehavior,
    "",
    "## 9. Agent Prompt Guide",
    "",
    "### Quick Color Reference",
    "```text",
    ...doc.agentPromptGuide.quickColorReference,
    "```",
    "",
    "### Example Prompts",
    ...renderBullets(doc.agentPromptGuide.examplePrompts),
    "",
    "### Iteration Guide",
    ...renderBullets(doc.agentPromptGuide.iterationGuide),
    "",
  ];

  return joinLines(lines);
}
