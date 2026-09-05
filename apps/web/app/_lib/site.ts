import {
  DOCS_BASE_URL,
  SITE_GITHUB_URL as CONTENT_GITHUB_URL,
} from "@getdesign/content";

export const SITE_NAME = "getdesign";
export const SITE_DOMAIN = "https://www.getdesign.app";
export const SITE_SOCIAL_IMAGE = {
  url: `${SITE_DOMAIN}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "getdesign · the design system for any URL",
};
/** Product documentation (Astro Starlight on Vercel). */
export const SITE_DOCS_URL = DOCS_BASE_URL;
/** Hosted web app. */
export const SITE_DASHBOARD_URL = "https://dashboard.getdesign.app";
export const SITE_APP_CTA_LABEL = "Extract a design system";
export const SITE_APP_CTA_SHORT = "Get started";
export const SITE_APP_CTA_BADGE = "Now in beta";
export const SITE_APP_CTA_SUBTEXT =
  "Bring your own Daytona and OpenAI keys. Pay those providers directly.";
export const SITE_APP_CTA_DESCRIPTION =
  "Sign in, save your Daytona and OpenAI keys in Account, then paste a URL to generate a design.md.";
export const SITE_RUN_COST_DESCRIPTION =
  "V1 has no getdesign run billing. You pay Daytona for browser capture and OpenAI for model usage.";
export const SITE_AUTH_DESCRIPTION =
  "The dashboard requires sign-in. Hosted design endpoints require Authorization: Bearer <WorkOS access token> plus your Daytona and OpenAI keys. There is no getdesign API key in V1.";
export const SITE_GITHUB_URL = CONTENT_GITHUB_URL;
export const SITE_COPYRIGHT = "© 2026 getdesign";
export const SITE_TAGLINE = "on-demand design systems";

export const PRODUCT_SURFACES = ["Web", "API", "CLI", "SDK", "Skill"] as const;
