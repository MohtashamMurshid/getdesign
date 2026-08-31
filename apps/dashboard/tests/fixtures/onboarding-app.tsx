import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import Overview from "../../app/(dashboard)/page";
import { ProviderKeysCard } from "../../app/(dashboard)/account/provider-keys-card";
import { AgentCommand } from "../../app/(dashboard)/agent/agent-command";
import { RunPageShell } from "../../app/(dashboard)/runs/[slug]/run-page-shell";
import { hasRequiredRunCredentials } from "../../lib/credential-readiness";
import { fixture, navigate, refresh } from "./onboarding-state";

window.fetch = (async (input, init) => {
  if (input !== "/api/credentials")
    throw new Error("Fixture blocks non-credential requests");
  const body = JSON.parse(String(init?.body));
  if (init?.method === "POST" && !body.key.startsWith("fixture-")) {
    return Response.json(
      { error: "Use dummy keys starting with fixture-." },
      { status: 400 },
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (fixture.failSave)
    return Response.json(
      { error: "Fixture save failed. Try again." },
      { status: 500 },
    );
  fixture.keys = fixture.keys.filter((key) => key.provider !== body.provider);
  if (init?.method === "POST") {
    fixture.keys.push({
      provider: body.provider,
      keySuffix: body.key.slice(-4),
      updatedAt: Date.now(),
    });
  }
  return Response.json({ ok: true, keySuffix: body.key?.slice(-4) });
}) as typeof window.fetch;

function App() {
  const [version, setVersion] = useState(0);
  const [overview, setOverview] = useState<ReactNode>(null);
  const [download, setDownload] = useState("");
  const [lastKey, setLastKey] = useState("");
  useEffect(() => {
    const update = () => setVersion((value) => value + 1);
    window.addEventListener("fixture-refresh", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("fixture-refresh", update);
      window.removeEventListener("popstate", update);
    };
  }, []);
  useEffect(() => {
    void Overview().then(setOverview);
  }, [version]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => setLastKey(event.key);
    const onClick = (event: MouseEvent) => {
      const anchor = event.target;
      if (anchor instanceof HTMLAnchorElement && anchor.download) {
        setDownload(`Download requested: ${anchor.download}`);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  const ready = hasRequiredRunCredentials(fixture.keys);
  const path = window.location.pathname;
  return (
    <>
      <nav
        aria-label="Fixture controls"
        className="flex flex-wrap gap-3 border-b bg-muted p-3 text-xs"
      >
        <span>Local mocked fixture. No real accounts or provider calls.</span>
        <button onClick={() => navigate("/")}>Overview</button>
        <button onClick={() => navigate("/account")}>Account</button>
        <button onClick={() => navigate("/agent")}>Agent</button>
        <button
          onClick={() => {
            fixture.populated = !fixture.populated;
            refresh();
          }}
        >
          Toggle completed runs
        </button>
        <button
          onClick={() => {
            fixture.failSave = !fixture.failSave;
            refresh();
          }}
        >
          Save failure: {fixture.failSave ? "on" : "off"}
        </button>
        <button
          onClick={() => {
            fixture.keys = [];
            refresh();
          }}
        >
          Clear fixture keys
        </button>
        <output aria-label="Fixture download">{download}</output>
        <output aria-label="Fixture last key">{lastKey}</output>
      </nav>
      <main>
        {path === "/account" ? (
          <div className="p-4">
            <ProviderKeysCard keys={fixture.keys} credentialsReady={ready} />
          </div>
        ) : path === "/agent" ? (
          <AgentCommand
            credentialsReady={ready}
            user={{ id: "fixture-user" }}
          />
        ) : path.startsWith("/runs/") ? (
          <RunPageShell
            runId="fixture-completed-run-with-a-long-identifier"
            userId="fixture-user"
            initialTiles={[]}
            exportMarkdown={fixture.markdown}
            markdownContent={
              <article className="p-6">
                <h1>Fixture design system</h1>
                <p>Mock completed run, no extraction performed.</p>
              </article>
            }
            runState={null}
          />
        ) : (
          overview
        )}
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
