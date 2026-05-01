import type { Api, StudioEnv } from "./index";

declare global {
  interface Window {
    api: Api;
    studioEnv?: StudioEnv;
  }
}
