import type {
  StudioDeckMode,
  StudioDeckSlideContent,
  StudioDeckTemplateSummary,
} from "../shared/studio-api";

/**
 * Curated starter templates. Kept intentionally small — see plan: small curated
 * starter set, not full gallery yet. Each template is a structural skeleton the
 * user can iterate on.
 */
export type StudioDeckTemplate = {
  id: string;
  title: string;
  description: string;
  mode: StudioDeckMode;
  slides: StudioDeckSlideContent[];
};

const TEMPLATES: StudioDeckTemplate[] = [
  {
    id: "launch-narrative",
    title: "Launch Narrative",
    description: "Cover, problem, solution, proof, roadmap, closing — classic 6-slide launch arc.",
    mode: "freeform",
    slides: [
      {
        label: "Cover",
        title: "Project codename",
        lede: "One-sentence positioning of what is launching today.",
        notes: "Open with the room-context. Set stakes in 30s.",
      },
      {
        label: "Problem",
        title: "The status quo is broken in a specific way",
        lede: "Name the user, the moment, and the cost of the current path.",
        notes: "Anchor the problem in a real workflow, not abstraction.",
      },
      {
        label: "Solution",
        title: "How this changes the workflow",
        lede: "The single biggest shift the user feels.",
        notes: "Show the before/after in one beat.",
      },
      {
        label: "Proof",
        title: "Why this works",
        lede: "Three concrete signals: outcome, mechanism, evidence.",
        notes: "Pick one number that you would defend in a hostile review.",
      },
      {
        label: "Roadmap",
        title: "What ships next",
        lede: "Sequenced milestones with one outcome each.",
        notes: "Avoid date theatre. Anchor on outcomes.",
      },
      {
        label: "Closing",
        title: "What we are asking for",
        lede: "The one decision you want from this room.",
        notes: "Land the ask in 15s. Repeat it slowly.",
      },
    ],
  },
  {
    id: "weekly-review",
    title: "Weekly Review",
    description: "Goals, progress, blockers, decisions, next week — repeatable 5-slide review.",
    mode: "pptx-safe",
    slides: [
      { label: "Cover", title: "Weekly review", lede: "Week of <date>." },
      { label: "Goals", title: "Goals this week", points: ["Goal 1", "Goal 2", "Goal 3"] },
      { label: "Progress", title: "What moved", points: ["Outcome 1", "Outcome 2"] },
      { label: "Blockers", title: "What is blocked", points: ["Blocker 1", "Blocker 2"] },
      { label: "Next", title: "Next week", points: ["Focus 1", "Focus 2"] },
    ],
  },
  {
    id: "single-pitch",
    title: "Single Pitch",
    description: "Two-slide showcase: cover plus one-page pitch — fastest path to a shareable HTML.",
    mode: "freeform",
    slides: [
      {
        label: "Cover",
        title: "Working title",
        lede: "A single sentence that earns the next 30 seconds.",
      },
      {
        label: "Pitch",
        title: "The one-page argument",
        lede: "Problem, insight, mechanism, ask — on one slide.",
      },
    ],
  },
  {
    id: "research-readout",
    title: "Research Readout",
    description: "Question, method, findings, implications, next steps — research-friendly 5-slide flow.",
    mode: "pptx-safe",
    slides: [
      { label: "Cover", title: "Research readout", lede: "<Topic>, <date>." },
      { label: "Question", title: "What we asked", lede: "The decision this study informs." },
      { label: "Method", title: "How we studied it", points: ["Sample", "Procedure", "Analysis"] },
      { label: "Findings", title: "What we learned", points: ["Finding 1", "Finding 2", "Finding 3"] },
      { label: "Next", title: "What we recommend", points: ["Action 1", "Action 2"] },
    ],
  },
  {
    id: "design-review",
    title: "Design Review",
    description: "Goal, options, recommendation, risks, decision — 5-slide design crit deck.",
    mode: "freeform",
    slides: [
      { label: "Cover", title: "Design review", lede: "<Surface>, round <n>." },
      { label: "Goal", title: "What we are deciding" },
      { label: "Options", title: "What we explored", points: ["Option A", "Option B", "Option C"] },
      { label: "Recommendation", title: "What we recommend" },
      { label: "Risks", title: "What we are watching", points: ["Risk 1", "Risk 2"] },
    ],
  },
];

export function listDeckTemplates(): StudioDeckTemplateSummary[] {
  return TEMPLATES.map((template) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    slideCount: template.slides.length,
    mode: template.mode,
  }));
}

export function findDeckTemplate(templateId: string): StudioDeckTemplate | undefined {
  return TEMPLATES.find((template) => template.id === templateId);
}
