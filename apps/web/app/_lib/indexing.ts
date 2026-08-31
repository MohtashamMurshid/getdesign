/** Vercel builds previews with NODE_ENV=production too. Fail closed elsewhere. */
export function isProductionDeployment(env = process.env): boolean {
  return (env.VERCEL_TARGET_ENV ?? env.VERCEL_ENV) === "production";
}
