import Link from "next/link"
import { withAuth } from "@workos-inc/authkit-nextjs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { getConvexClient } from "@/lib/convex-server"
import { api } from "@convex/_generated/api"

const MOCK_STATS = {
  globalRuns: 3_201_056,
  cachedSites: 12847,
  topSites: [
    "stripe.com",
    "linear.app",
    "vercel.com",
    "notion.so",
    "github.com",
  ],
}


type DesignRun = {
  slug: string
  domain: string
  title: string
  theme: string
  colors: string[]
  accent: string
}

function parseDesignMd(content: string): Pick<DesignRun, "title" | "theme" | "colors" | "accent"> {
  const titleMatch = content.match(/^# (.+)/m)
  const title = titleMatch
    ? titleMatch[1].replace(/\s*Design System\s*$/i, "").trim()
    : "Unknown"

  const themeMatch = content.match(/## 1\. Visual Theme & Atmosphere\n\n([^\n]+)/)
  const theme = themeMatch ? themeMatch[1].trim() : ""

  // Extract solid 6-digit hex colors from backtick blocks only
  const colorMatches = [...content.matchAll(/`(#[A-Fa-f0-9]{6})(?![A-Fa-f0-9])/g)]
  const colors = [...new Set(colorMatches.map((m) => m[1]))].slice(0, 12)

  // Accent = first non-dark, non-near-black color
  const accent =
    colors.find((c) => {
      const r = parseInt(c.slice(1, 3), 16)
      const g = parseInt(c.slice(3, 5), 16)
      const b = parseInt(c.slice(5, 7), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness > 80
    }) ?? colors[0] ?? "#888888"

  return { title, theme, colors, accent }
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

function Favicon({ domain }: { domain: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
      alt=""
      width={16}
      height={16}
      className="rounded-sm opacity-80"
    />
  )
}


export default async function Page() {
  const { user } = await withAuth({ ensureSignedIn: true })
  const convex = getConvexClient()
  const recent = await convex.query(api.designRuns.listRecent, {
    userId: user.id,
    limit: 24,
  })
  const runs = (
    await Promise.all(
      recent
        .filter((run) => run.status === "completed")
        .map(async (run) => {
          const artifacts = await convex.query(api.designRunArtifacts.getForRun, {
            runId: run._id,
            userId: user.id,
          })
          if (typeof artifacts.markdown !== "string") return null
          return {
            slug: String(run._id),
            domain: run.domain,
            ...parseDesignMd(artifacts.markdown),
          }
        }),
    )
  ).filter((run): run is DesignRun => Boolean(run))

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border p-5">
            <p className="text-xs text-muted-foreground mb-2">Your runs</p>
            <p className="text-4xl font-semibold tracking-tight">{runs.length}</p>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-xs text-muted-foreground mb-2">Total runs</p>
            <p className="text-4xl font-semibold tracking-tight">{fmt(MOCK_STATS.globalRuns)}</p>
          </div>

          <div className="rounded-xl border p-5">
            <p className="text-xs text-muted-foreground mb-2">Sites cached</p>
            <p className="text-4xl font-semibold tracking-tight">{fmt(MOCK_STATS.cachedSites)}</p>
            <ul className="mt-3 space-y-1.5 border-t pt-3">
              {MOCK_STATS.topSites.map((site) => (
                <li key={site} className="flex items-center gap-2">
                  <Favicon domain={site} />
                  <span className="text-xs text-muted-foreground">{site}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recent runs */}
        <div className="rounded-xl border">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <p className="text-sm font-medium">Recent runs</p>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto py-1">
              View all
            </Button>
          </div>
          <div className="divide-y">
            {runs.map((run) => (
              <Link
                key={run.slug}
                href={`/runs/${run.slug}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                {/* Color strip */}
                <div className="flex h-8 w-32 shrink-0 rounded-md overflow-hidden border">
                  {run.colors.map((color, i) => (
                    <div
                      key={`${color}-${i}`}
                      className="flex-1"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Title + theme */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{run.title}</p>
                  {run.theme && (
                    <p className="text-xs text-muted-foreground truncate">{run.theme}</p>
                  )}
                </div>

                {/* Accent dot + hex */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: run.accent }}
                  />
                  <span className="text-xs font-mono text-muted-foreground">{run.accent}</span>
                </div>

                {/* Color count */}
                <span className="text-xs text-muted-foreground shrink-0 w-20 text-right">
                  {run.colors.length} colors
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
