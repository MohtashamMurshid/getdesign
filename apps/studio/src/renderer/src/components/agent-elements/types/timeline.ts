export type StepState = "pending" | "animating" | "complete";

export type TimelineStep =
  | {
      id: string;
      type: "input-typing";
      content: string;
      image?: string;
      duration: number;
    }
  | {
      id: string;
      type: "user-message";
      content: string;
      image?: string;
    }
  | {
      id: string;
      type: "tool-call";
      toolName: string;
      toolDetail: string;
      duration: number;
      toolVariant?: "thinking" | "action" | "search";
      thoughtContent?: string;
      searchQuery?: string;
      searchSource?: string;
      filePath?: string;
      diffStats?: string;
      diffLines?: { type: "add" | "remove" | "context"; content: string }[];
      bashCommand?: string;
      bashOutput?: string;
      bashSuccess?: boolean;
    }
  | {
      id: string;
      type: "assistant-stream";
      content: string;
    }
  | {
      id: string;
      type: "pause";
      duration: number;
    };

export type Turn = { userStep?: TimelineStep; steps: TimelineStep[] };
