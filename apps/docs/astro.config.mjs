import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { createStarlightTypeDocPlugin } from "starlight-typedoc";

const [sdkTypeDoc, sdkTypeDocSidebar] = createStarlightTypeDocPlugin();

const SITE = "https://docs.getdesign.app";

export default defineConfig({
  site: SITE,
  build: {
    format: "directory",
  },
  integrations: [
    sitemap(),
    starlight({
      title: "getdesign docs",
      description:
        "Documentation for getdesign: the design system for any URL. Web, API, CLI, SDK, and Skill.",
      logo: {
        src: "./src/assets/logo.svg",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/MohtashamMurshid/getdesign",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/MohtashamMurshid/getdesign/edit/main/apps/docs/",
      },
      customCss: ["./src/styles/brand.css"],
      components: {
        Head: "./src/components/Head.astro",
      },
      head: [
        {
          tag: "link",
          attrs: {
            rel: "alternate",
            type: "text/plain",
            href: "/llms.txt",
            title: "getdesign llms.txt",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "alternate",
            type: "text/plain",
            href: "/llms-full.txt",
            title: "getdesign llms-full.txt",
          },
        },
      ],
      lastUpdated: true,
      pagination: true,
      plugins: [
        sdkTypeDoc({
          entryPoints: ["../../packages/sdk/src/index.ts"],
          tsconfig: "../../packages/sdk/tsconfig.json",
          output: "reference/sdk",
          sidebar: {
            label: "SDK",
            collapsed: false,
          },
          typeDoc: {
            excludeInternal: true,
            excludePrivate: true,
          },
        }),
      ],
      sidebar: [
        {
          label: "Start here",
          items: [
            { slug: "index" },
            { slug: "quickstart" },
            { slug: "concepts" },
          ],
        },
        {
          label: "Surfaces",
          items: [
            { slug: "surfaces/web" },
            { slug: "surfaces/api" },
            { slug: "surfaces/cli" },
            { slug: "surfaces/sdk" },
            { slug: "surfaces/skill" },
          ],
        },
        {
          label: "Guides",
          items: [
            { slug: "guides/use-with-cursor" },
            { slug: "guides/use-with-claude-code" },
            { slug: "guides/use-with-codex" },
            { slug: "guides/sdk-in-next" },
            { slug: "guides/call-the-api" },
          ],
        },
        {
          label: "Reference",
          items: [
            sdkTypeDocSidebar,
            {
              label: "CLI",
              autogenerate: { directory: "reference/cli" },
            },
          ],
        },
        {
          label: "Resources",
          items: [
            { slug: "resources/changelog" },
            { slug: "resources/faq" },
            { slug: "resources/llms" },
          ],
        },
      ],
    }),
  ],
});
