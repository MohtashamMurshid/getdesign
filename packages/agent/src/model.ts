import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

const DEFAULT_MODEL_ID = "gpt-5.3-codex";

export type ResolveModelOptions = {
  modelId?: string;
  apiKey?: string;
  baseURL?: string;
};

/**
 * Resolve the LLM used by the Synthesizer. The default is `gpt-5.3-codex` via
 * the OpenAI provider; override via `GETDESIGN_MODEL` or by passing a modelId.
 * The model id is treated as a bare provider model id (e.g. `gpt-5.3-codex`),
 * not a gateway-qualified id (no `openai/` prefix).
 */
export function resolveModel(options: ResolveModelOptions = {}): LanguageModel {
  const modelId = options.modelId ?? process.env.GETDESIGN_MODEL ?? DEFAULT_MODEL_ID;
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;

  const provider = createOpenAI({
    apiKey,
    baseURL: options.baseURL,
  });

  return provider(modelId);
}

export function getDefaultModelId(): string {
  return DEFAULT_MODEL_ID;
}
