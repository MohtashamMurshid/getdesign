import { SKILL_INSTALL_CMD, docsUrl } from "@getdesign/content";

import {
  CopyCommand,
  DocsLinkCard,
  SurfacePageShell,
} from "@/components/developer";

function SkillDemo() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
          claude-code · skill: getdesign
        </div>
      </div>
      <div className="space-y-3 px-4 py-5 font-mono text-[12.5px] leading-relaxed">
        <p className="text-muted-foreground">
          <span className="tok-com"># Install once, then ask your agent</span>
        </p>
        <p>
          <span className="text-muted-foreground">$</span>{" "}
          <span className="text-foreground">{SKILL_INSTALL_CMD}</span>
        </p>
        <p className="text-muted-foreground">
          <span className="tok-com">✓</span> skill registered · getdesign
        </p>
        <pre className="m-0 whitespace-pre-wrap break-words rounded-md border bg-muted/50 p-3 text-foreground">
          <span className="tok-key">You</span>
          {"\n"}
          Match this landing page to cursor.com
          {"\n\n"}
          <span className="tok-key">Agent</span>
          {"\n"}
          Using skill <span className="tok-str">getdesign</span>…
          {"\n"}
          Writing <span className="tok-str">design.md</span>
          <span className="caret" />
        </pre>
      </div>
    </div>
  );
}

export default function SkillsPage() {
  return (
    <SurfacePageShell
      title="Skills"
      description="Install getdesign as an agent skill so Cursor, Claude Code, or Codex can pull a design.md into context."
      demo={<SkillDemo />}
    >
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Install</h2>
        <CopyCommand label="skills.sh" command={SKILL_INSTALL_CMD} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Use it</h2>
        <p className="text-sm text-muted-foreground">
          After install, ask your coding agent to match a brand or generate a
          design system from a URL. The skill uses the same agent core as the
          API, CLI, and SDK.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Guides</h2>
        <div className="grid gap-2">
          <DocsLinkCard
            href={docsUrl("/surfaces/skill")}
            title="Skill surface"
            description="What the skill does and how it fits the five surfaces"
          />
          <DocsLinkCard
            href={docsUrl("/guides/use-with-cursor")}
            title="Use with Cursor"
            description="Wire getdesign into Cursor Agent"
          />
          <DocsLinkCard
            href={docsUrl("/guides/use-with-claude-code")}
            title="Use with Claude Code"
            description="Skill install and prompt patterns"
          />
          <DocsLinkCard
            href={docsUrl("/guides/use-with-codex")}
            title="Use with Codex"
            description="Codex-specific setup"
          />
        </div>
      </section>
    </SurfacePageShell>
  );
}
