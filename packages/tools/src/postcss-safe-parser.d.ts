declare module "postcss-safe-parser" {
  import type { ProcessOptions, Root } from "postcss";

  export default function safeParse(
    css: string,
    opts?: ProcessOptions,
  ): Root;
}
