// Run through onboarding.test.ts. Bun's module mocks are process-wide.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";

import { hasRequiredRunCredentials } from "../lib/credential-readiness";
import type { ProviderKeyMeta } from "../app/(dashboard)/account/provider-keys-card";

let auth: { user: { id: string } | null; accessToken?: string };
let storedKeys: ProviderKeyMeta[] = [];
const query = mock(async () => storedKeys);
const getConvexClient = mock(() => ({ query }));

mock.module("@workos-inc/authkit-nextjs", () => ({
  withAuth: async () => auth,
}));
mock.module("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  useRouter: () => ({ refresh() {}, push() {} }),
}));
mock.module("@/lib/convex-server", () => ({ getConvexClient }));
mock.module("convex/react", () => ({ useMutation: () => mock() }));

const { ExtractionOnboarding } =
  await import("../components/extraction-onboarding");
const { ExtractionGuide, EmptyDesignRuns } =
  await import("../components/extraction-guide");
const { ProviderKeysCard } =
  await import("../app/(dashboard)/account/provider-keys-card");
const { AgentCommand } = await import("../app/(dashboard)/agent/agent-command");
const { ExportActions } =
  await import("../app/(dashboard)/runs/[slug]/export-actions");

const key = (provider: ProviderKeyMeta["provider"]): ProviderKeyMeta => ({
  provider,
  keySuffix: "demo",
  updatedAt: 1,
});

beforeEach(() => {
  auth = { user: { id: "fixture-user" }, accessToken: "fixture-token" };
  storedKeys = [];
  getConvexClient.mockClear();
  query.mockClear();
});

describe("extraction onboarding", () => {
  for (const providers of [
    [],
    ["daytona"],
    ["openai"],
    ["daytona", "openai"],
  ] as ProviderKeyMeta["provider"][][]) {
    test(`server readiness and Account guidance with ${providers.join(" + ") || "no keys"}`, async () => {
      storedKeys = providers.map(key);
      const ready = hasRequiredRunCredentials(storedKeys);
      const html = renderToStaticMarkup(await ExtractionOnboarding());
      expect(getConvexClient).toHaveBeenCalledWith("fixture-token");
      expect(query).toHaveBeenCalledWith(expect.anything(), {});
      expect(html).toContain('href="/agent"');
      expect(html).toContain("Extract a design system");
      expect(html.includes('href="/account#provider-keys"')).toBe(!ready);
      expect(html.includes("Both provider keys are saved")).toBe(ready);
      expect(html).not.toContain("fixture-token");
      expect(html).not.toContain("demo");

      const account = renderToStaticMarkup(
        <ProviderKeysCard keys={storedKeys} credentialsReady={ready} />,
      );
      expect(account).toContain('id="provider-keys"');
      expect(account).toContain(ready ? "Continue to Agent" : "Back to Agent");
      for (const provider of ["daytona", "openai"] as const) {
        expect(account.includes(`id="${provider}-key"`)).toBe(
          !providers.includes(provider),
        );
      }
      if (providers.length === 1) {
        expect(account).toContain(
          `Save your ${providers[0] === "daytona" ? "OpenAI" : "Daytona"} key above`,
        );
      }
    });
  }

  for (const session of [{ user: null }, { user: { id: "fixture-user" } }]) {
    test(`requires an authenticated user and access token: ${JSON.stringify(session)}`, async () => {
      auth = session;
      await expect(ExtractionOnboarding()).rejects.toThrow("redirect:/sign-in");
      expect(getConvexClient).not.toHaveBeenCalled();
    });
  }

  test("the CTA is unconditional and before recent runs; empty state appears only without completed runs", () => {
    const page = readFileSync(
      new URL("../app/(dashboard)/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page.indexOf("<ExtractionOnboarding />")).toBeLessThan(
      page.indexOf("{/* Recent runs */}"),
    );
    expect(page).toContain("{runs.length === 0 ? <EmptyDesignRuns /> : null}");
    expect(renderToStaticMarkup(<EmptyDesignRuns />)).toContain(
      "No completed design systems yet",
    );
    expect(
      renderToStaticMarkup(<ExtractionGuide credentialsReady={false} />),
    ).toContain("download design.md");
  });

  test("the Agent explains the result and keeps the URL input disabled without both keys", () => {
    for (const ready of [false, true]) {
      const html = renderToStaticMarkup(
        <AgentCommand credentialsReady={ready} user={{ id: "fixture-user" }} />,
      );
      expect(html).toContain("download design.md");
      expect(html.includes("Set up provider keys")).toBe(!ready);
      expect(/<textarea[^>]*disabled=""/.test(html)).toBe(!ready);
      expect(html).toContain('aria-label="Start extraction"');
    }
  });

  test("completed runs have a visible, keyboard-accessible design.md download", () => {
    const html = renderToStaticMarkup(
      <ExportActions content="# Fixture" filename="design.md" />,
    );
    expect(html).toContain('aria-label="Download design.md"');
    expect(html).toContain("Download design.md</button>");
    const shell = readFileSync(
      new URL(
        "../app/(dashboard)/runs/[slug]/run-page-shell.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    expect(shell).toContain('filename="design.md"');
    expect(shell).toContain("{exportMarkdown ? (");
  });
});
