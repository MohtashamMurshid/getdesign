import {
  DOCS_BASE_URL,
  SITE_GITHUB_URL as CONTENT_GITHUB_URL,
} from "@getdesign/content";

export const SITE_NAME = "getdesign";
export const SITE_DOMAIN = "https://www.getdesign.app";
/** Product documentation (Astro Starlight on Vercel). */
export const SITE_DOCS_URL = DOCS_BASE_URL;
export const SITE_GITHUB_URL = CONTENT_GITHUB_URL;
export const SITE_COPYRIGHT = "© 2026 getdesign";
export const SITE_TAGLINE = "on-demand design systems";

export const PRODUCT_SURFACES = ["Web", "API", "CLI", "SDK", "Skill"] as const;
