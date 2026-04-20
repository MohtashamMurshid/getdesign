import type { InferAgentUIMessage } from "ai";

import { createCoordinator } from "./agents/coordinator";

type CoordinatorInstance = ReturnType<typeof createCoordinator>["agent"];

/**
 * UIMessage type for the CoordinatorAgent, for use with
 * `useChat<GetDesignUIMessage>()` on the web and by any typed SDK client.
 */
export type GetDesignUIMessage = InferAgentUIMessage<CoordinatorInstance>;
