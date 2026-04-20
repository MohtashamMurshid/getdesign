import { runDesign } from "@getdesign/agent";

import { createApp } from "../src/app";

export const config = {
  runtime: "nodejs",
  maxDuration: 300,
};

const app = createApp({ runDesign });

export default async function handler(req: Request): Promise<Response> {
  return app.fetch(req);
}
