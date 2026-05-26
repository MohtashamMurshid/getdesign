import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { withAuth } from "@workos-inc/authkit-nextjs"
import {
  getInlineCodeText,
  HexColorCode,
  isHexColor,
  renderChildrenWithHexColors,
  renderTextWithHexColors,
} from "@/components/design-md-hex"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getConvexClient } from "@/lib/convex-server"
import { toRunState } from "@/lib/runs-store"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { ExportActions } from "./export-actions"
import { RunProgress } from "./run-progress"
import { ScreenshotsButton } from "./screenshots-button"

export default async function RunPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { user } = await withAuth({ ensureSignedIn: true })
  const convex = getConvexClient()
  const run = await convex.query(api.designRuns.get, {
    id: slug as Id<"designRuns">,
    userId: user.id,
  })

  if (!run) notFound()

  const runState = toRunState(run)
  const artifacts = await convex.query(api.designRunArtifacts.getForRun, {
    runId: slug as Id<"designRuns">,
    userId: user.id,
  })
  const tiles = await convex.query(api.designRunArtifacts.getTileUrls, {
    runId: slug as Id<"designRuns">,
    userId: user.id,
  })

  const content =
    runState.status === "completed" && typeof artifacts.markdown === "string"
      ? artifacts.markdown
      : null

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Overview</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{slug}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {content ? (
          <div className="ml-auto flex items-center gap-1">
            {tiles.length > 0 ? (
              <ScreenshotsButton runId={slug} tiles={tiles} />
            ) : null}
            <ExportActions content={content} filename={`${slug}.md`} />
          </div>
        ) : null}
      </header>

      {content ? (
      <div className="flex flex-1 justify-center p-6">
        <article className="w-full max-w-3xl mx-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-semibold tracking-tight mb-6">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold mt-10 mb-3 pb-2 border-b">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mt-6 mb-2 text-muted-foreground uppercase tracking-wider">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-sm leading-relaxed text-muted-foreground mb-3 text-justify">{renderChildrenWithHexColors(children)}</p>
              ),
              ul: ({ children }) => (
                <ul className="text-sm text-muted-foreground space-y-1 mb-3 ml-4 list-disc">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed text-justify">{renderChildrenWithHexColors(children)}</li>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="border-b">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="text-left text-xs font-medium text-muted-foreground py-2 pr-6">{children}</th>
              ),
              td: ({ children }) => (
                <td className="py-2 pr-6 text-sm text-muted-foreground align-top">{renderChildrenWithHexColors(children)}</td>
              ),
              tr: ({ children }) => (
                <tr className="border-b border-border/50 last:border-0">{children}</tr>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-")
                if (isBlock) {
                  return (
                    <code className="block bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto mb-4">
                      {renderTextWithHexColors(String(children))}
                    </code>
                  )
                }
                const text = getInlineCodeText(children)
                if (isHexColor(text)) {
                  return <HexColorCode hex={text} />
                }
                return (
                  <code className="inline-flex items-center gap-1.5 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    {children}
                  </code>
                )
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 pl-4 text-sm text-muted-foreground italic mb-3">{children}</blockquote>
              ),
              hr: () => <hr className="my-6 border-border/50" />,
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
      ) : runState ? (
        <RunProgress initialRun={runState} userId={user.id} />
      ) : null}
    </>
  )
}
