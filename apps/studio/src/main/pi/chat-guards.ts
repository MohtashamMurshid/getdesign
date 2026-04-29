import type { StoredChatSession } from "./types";

import { asRecord } from "./record-utils";

export function isStoredChatSession(
  value: unknown,
): value is StoredChatSession {
  const record = asRecord(value);
  return Boolean(
    record &&
      typeof record["id"] === "string" &&
      typeof record["title"] === "string" &&
      typeof record["artifactId"] === "string" &&
      typeof record["createdAt"] === "number" &&
      typeof record["updatedAt"] === "number" &&
      Array.isArray(record["messages"]),
  );
}
