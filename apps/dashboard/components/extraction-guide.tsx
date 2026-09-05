import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function ExtractionGuide({
  credentialsReady,
}: {
  credentialsReady: boolean;
}) {
  return (
    <section
      aria-labelledby="extraction-heading"
      className="rounded-xl border bg-card p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 id="extraction-heading" className="text-base font-medium">
            Turn a website into a design system
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a public URL in Agent. When the run finishes, open it and
            download design.md.
          </p>
        </div>
        <Link
          href="/agent"
          className={buttonVariants({
            size: "lg",
            className: "self-start sm:self-auto",
          })}
        >
          Extract a design system
        </Link>
      </div>
      <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
        {credentialsReady ? (
          "Both provider keys are saved. You can start an extraction in Agent."
        ) : (
          <>
            To start an extraction, save your Daytona and OpenAI keys in{" "}
            <Link
              href="/account#provider-keys"
              className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Account settings
            </Link>
            . Then return to Agent to start your run.
          </>
        )}
      </p>
    </section>
  );
}

export function EmptyDesignRuns() {
  return (
    <div className="px-5 py-8">
      <p className="text-sm font-medium">No completed design systems yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Start an extraction in Agent. Completed runs appear here. Open a run to
        download its design.md.
      </p>
    </div>
  );
}
