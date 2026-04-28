import type { StudioCustomProviderApi } from "../../../shared/studio-api";

export const CUSTOM_PROVIDER_API_OPTIONS: {
  value: StudioCustomProviderApi;
  label: string;
}[] = [
  { value: "openai-completions", label: "OpenAI Chat Completions" },
  { value: "openai-responses", label: "OpenAI Responses API" },
  { value: "anthropic-messages", label: "Anthropic Messages" },
  { value: "google-generative-ai", label: "Google Generative AI" },
];

export const BYOK_PROVIDER_OPTIONS: { value: string; label: string }[] = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google Gemini" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "vercel-ai-gateway", label: "Vercel AI Gateway" },
];
