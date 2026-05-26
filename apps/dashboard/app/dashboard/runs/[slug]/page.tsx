import fs from "fs"
import path from "path"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { withAuth } from "@workos-inc/authkit-nextjs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { assertOwner, runDir } from "@/lib/runs-store"
import { RunProgress } from "./run-progress"

export default async function RunPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const stateFilePath = path.join(runDir(slug), "state.json")
  const filePath = path.join(process.cwd(), "../../getdesign-runs", slug, "design.md")

  let runState = null
  if (fs.existsSync(stateFilePath)) {
    const { user } = await withAuth({ ensureSignedIn: true })
    runState = await assertOwner(slug, user.id)
  }

  if (!fs.existsSync(filePath) && !runState) notFound()

  const content = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf-8")
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
                <p className="text-sm leading-relaxed text-muted-foreground mb-3 text-justify">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="text-sm text-muted-foreground space-y-1 mb-3 ml-4 list-disc">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed text-justify">{children}</li>
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
                <td className="py-2 pr-6 text-sm text-muted-foreground align-top">{children}</td>
              ),
              tr: ({ children }) => (
                <tr className="border-b border-border/50 last:border-0">{children}</tr>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-")
                if (isBlock) {
                  return (
                    <code className="block bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto mb-4">
                      {children}
                    </code>
                  )
                }
                // Inline hex color swatch — 3, 6, or 8 digit
                const text = String(children).trim()
                const hexMatch = text.match(/^(#[A-Fa-f0-9]{8}|#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3})$/)
                // For display, strip alpha from 8-digit so the swatch shows the base color
                const swatchColor = hexMatch
                  ? hexMatch[1].length === 9 ? hexMatch[1].slice(0, 7) : hexMatch[1]
                  : null
                return (
                  <code className="inline-flex items-center gap-1.5 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    {swatchColor && (
                      <span
                        className="inline-block size-2.5 rounded-sm shrink-0 border border-white/10"
                        style={{ backgroundColor: swatchColor }}
                      />
                    )}
                    {text}
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
        <RunProgress initialRun={runState} />
      ) : null}
    </>
  )
}
