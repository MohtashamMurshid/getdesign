import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ExtractionGuide } from "../components/extraction-guide";

type RunFixture = {
  _id: string;
  domain: string;
  status: "queued" | "running" | "completed" | "failed";
};

let recent: RunFixture[] = [];
let artifacts: Record<string, { markdown?: string }> = {};

const query = mock(async (_reference: unknown, args: Record<string, unknown>) => {
  if ("runId" in args) return artifacts[String(args.runId)] ?? {};
  return recent.slice(0, Number(args.limit));
});

// Mock auth/data and the independently tested onboarding server boundary.
// Keep the real onboarding UI in this render to check the combined Overview.
mock.module("@workos-inc/authkit-nextjs", () => ({
  withAuth: async () => ({ user: { id: "overview-test-user" } }),
}));
mock.module("./convex-server", () => ({
  getConvexClient: () => ({ query }),
}));
mock.module("../components/extraction-onboarding", () => ({
  ExtractionOnboarding: () => <ExtractionGuide credentialsReady={false} />,
}));

const { default: Page } = await import("../app/(dashboard)/page");

beforeEach(() => {
  recent = [];
  artifacts = {};
  query.mockClear();
});

function completedRun(id: string): RunFixture {
  artifacts[id] = { markdown: `# ${id} Design System\n\nAccent: \`#abcdef\`` };
  return { _id: id, domain: `${id}.example`, status: "completed" };
}

describe("Overview recent-run summary", () => {
  test("keeps onboarding above recent runs and explains the empty state", async () => {
    const html = renderToStaticMarkup(await Page());

    expect(html).toContain('href="/agent"');
    expect(html).toContain("Extract a design system");
    expect(html.indexOf("Extract a design system")).toBeLessThan(html.indexOf("Recent runs"));
    expect(html).toContain("No completed design systems yet");
    expect(html).toContain('href="/account#provider-keys"');
  });

  test("removes unsupported statistics, cached sites, and the inactive View all control", async () => {
    const html = renderToStaticMarkup(await Page());

    for (const removed of [
      "Your runs",
      "Total runs",
      "Sites cached",
      "3.2M",
      "13k",
      "stripe.com",
      "linear.app",
      "vercel.com",
      "notion.so",
      "github.com",
      "google.com/s2/favicons",
      "View all",
    ]) {
      expect(html).not.toContain(removed);
    }
    expect(html).toContain("Recent runs");
    expect(html).toContain("0 shown");
  });

  test("counts only displayed completed runs with design files, scoped to the user", async () => {
    recent = [
      completedRun("visible"),
      { _id: "queued", domain: "queued.example", status: "queued" },
      { _id: "running", domain: "running.example", status: "running" },
      { _id: "failed", domain: "failed.example", status: "failed" },
      { _id: "missing", domain: "missing.example", status: "completed" },
    ];

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("1 shown");
    expect(html).toContain("Completed runs with design files from your latest 24 runs.");
    expect(html).toContain('href="/runs/visible"');
    for (const id of ["queued", "running", "failed", "missing"]) {
      expect(html).not.toContain(`href="/runs/${id}"`);
    }
    expect(query.mock.calls.map(([, args]) => args)).toEqual([
      { userId: "overview-test-user", limit: 24 },
      { userId: "overview-test-user", runId: "visible" },
      { userId: "overview-test-user", runId: "missing" },
    ]);
  });

  test("labels a full query window as shown runs, not a lifetime total", async () => {
    recent = Array.from({ length: 25 }, (_, i) => completedRun(`run-${i}`));

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("24 shown");
    expect(html).toContain("from your latest 24 runs.");
    expect(html.match(/href="\/runs\//g)).toHaveLength(24);
    expect(html).not.toContain('href="/runs/run-24"');
  });
});
