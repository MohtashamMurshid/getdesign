declare module "postcss-safe-parser" {
  import type { Root } from "postcss";

  export default function safeParse(
    css: string,
    opts?: Record<string, unknown>,
  ): Root;
}
