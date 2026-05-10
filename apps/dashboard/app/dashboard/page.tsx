"use client"

import * as React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const MOCK_STATS = {
  personalRuns: 48,
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

const MOCK_RECENT_RUNS = [
  { domain: "stripe.com", ago: "2h ago", status: "cached" },
  { domain: "linear.app", ago: "5h ago", status: "fresh" },
  { domain: "vercel.com", ago: "1d ago", status: "cached" },
  { domain: "resend.com", ago: "2d ago", status: "cached" },
  { domain: "tailwindcss.com", ago: "3d ago", status: "fresh" },
]

function Favicon({ domain }: { domain: string }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
      alt=""
      width={16}
      height={16}
      className="rounded-sm opacity-80"
    />
  )
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

export default function Page() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border p-5">
            <p className="text-xs text-muted-foreground mb-2">Your runs</p>
            <p className="text-4xl font-semibold tracking-tight">{fmt(MOCK_STATS.personalRuns)}</p>
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
            {MOCK_RECENT_RUNS.map((run) => (
              <div
                key={run.domain}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                <Favicon domain={run.domain} />
                <span className="flex-1 text-sm">{run.domain}</span>
                <span className="text-xs text-muted-foreground">{run.ago}</span>
                <span
                  className={[
                    "text-xs px-2 py-0.5 rounded-full",
                    run.status === "cached"
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary",
                  ].join(" ")}
                >
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
