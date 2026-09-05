import type { ComponentProps } from "react";
import { getFunctionName } from "convex/server";
import { ExtractionGuide } from "../../components/extraction-guide";
import { hasRequiredRunCredentials } from "../../lib/credential-readiness";
import { fixture, navigate, refresh } from "./onboarding-state";

export default function Link({
  href,
  children,
  ...props
}: ComponentProps<"a">) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        navigate(href ?? "/");
      }}
    >
      {children}
    </a>
  );
}

export function useRouter() {
  return { refresh, push: navigate };
}
export function redirect(path: string): never {
  throw new Error(`Unexpected fixture redirect: ${path}`);
}
export async function withAuth() {
  return { user: { id: "fixture-user" }, accessToken: "fixture-token" };
}
export function ExtractionOnboarding() {
  return (
    <ExtractionGuide
      credentialsReady={hasRequiredRunCredentials(fixture.keys)}
    />
  );
}
export function useMutation() {
  return async () => "fixture-completed-run";
}
export function useQuery() {
  return [];
}
export function getConvexClient() {
  return {
    async query(reference: Parameters<typeof getFunctionName>[0]) {
      switch (getFunctionName(reference)) {
        case "designRuns:listRecent":
          return fixture.populated
            ? [
                {
                  _id: "fixture-completed-run",
                  domain: "example.test",
                  status: "completed",
                },
              ]
            : [];
        case "designRunArtifacts:getForRun":
          return { markdown: fixture.markdown };
        case "userCredentials:listForUser":
          return fixture.keys;
        default:
          throw new Error("Unexpected query in local fixture");
      }
    },
  };
}
