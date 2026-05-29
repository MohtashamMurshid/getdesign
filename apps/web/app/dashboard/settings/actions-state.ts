export type SettingsActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

export const INITIAL_SETTINGS_STATE: SettingsActionState = { status: "idle" };
