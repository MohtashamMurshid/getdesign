import { isRecord } from "@/lib/type-guards";

function parseStructuredJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;

  try {
    const parsed = JSON.parse(trimmed);
    return isRecord(parsed) || Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
}

export function normalizeToolPart(part: unknown): unknown {
  if (!isRecord(part)) return part;
  if (typeof part.type !== "string" || !part.type.startsWith("tool-"))
    return part;

  const normalizedInput = parseStructuredJson(part.input);
  const normalizedOutput = parseStructuredJson(part.output);
  const normalizedResult = parseStructuredJson(part.result);

  const inputChanged = normalizedInput !== part.input;
  const outputChanged = normalizedOutput !== part.output;
  const resultChanged = normalizedResult !== part.result;

  if (!inputChanged && !outputChanged && !resultChanged) {
    return part;
  }

  const normalizedPart: Record<string, unknown> = { ...part };
  if (inputChanged) normalizedPart.input = normalizedInput;
  if (outputChanged) normalizedPart.output = normalizedOutput;
  if (resultChanged) normalizedPart.result = normalizedResult;
  return normalizedPart;
}

export function normalizeAssistantToolParts(parts: unknown[]): unknown[] {
  let changed = false;
  const normalizedParts = parts.map((part) => {
    const normalizedPart = normalizeToolPart(part);
    if (normalizedPart !== part) changed = true;
    return normalizedPart;
  });

  return changed ? normalizedParts : parts;
}
