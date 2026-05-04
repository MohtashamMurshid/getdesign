import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packagesDir = join(repoRoot, "packages");
const packOrder = ["types", "tools", "agent", "sdk", "cli"];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, ...(options.env ?? {}) },
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(
      `${command} ${args.join(" ")} failed with exit code ${result.status}${detail ? `\n${detail}` : ""}`,
    );
  }

  return result;
}

async function newestTarball(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const tarballs = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tgz"))
    .map((entry) => join(directory, entry.name));

  if (tarballs.length !== 1) {
    throw new Error(`Expected exactly one tarball in ${directory}, found ${tarballs.length}.`);
  }

  return tarballs[0];
}

async function main() {
  const workDir = await mkdtemp(join(tmpdir(), "getdesign-npm-smoke-"));
  const packDir = join(workDir, "packs");
  const projectDir = join(workDir, "project");

  try {
    run("mkdir", ["-p", packDir, projectDir]);

    const tarballs = new Map();
    for (const packageName of packOrder) {
      const packageDir = join(packagesDir, packageName);
      run("bun", ["run", "build"], { cwd: packageDir });
      const before = new Set(await readdir(packDir));
      run("npm", ["pack", "--silent", "--pack-destination", packDir], { cwd: packageDir });
      const after = await readdir(packDir);
      const created = after
        .filter((entry) => entry.endsWith(".tgz"))
        .map((entry) => join(packDir, entry))
        .sort();
      const tarball = created.find((entry) => !before.has(basename(entry))) ?? await newestTarball(packDir);
      tarballs.set(packageName, tarball);
    }

    await writeFile(
      join(projectDir, "package.json"),
      JSON.stringify({ type: "module", private: true }, null, 2),
      "utf8",
    );

    run(
      "npm",
      [
        "install",
        "--no-audit",
        "--no-fund",
        tarballs.get("types"),
        tarballs.get("tools"),
        tarballs.get("agent"),
        tarballs.get("sdk"),
        tarballs.get("cli"),
      ],
      { cwd: projectDir },
    );

    run(
      "node",
      [
        "--input-type=module",
        "--eval",
        "import { getDesign, streamDesign, version } from '@getdesign/sdk'; if (typeof getDesign !== 'function' || typeof streamDesign !== 'function' || typeof version !== 'string') throw new Error('unexpected sdk exports');",
      ],
      { cwd: projectDir },
    );

    const cliHelp = run("npx", ["--no-install", "getdesign", "--help"], {
      cwd: projectDir,
      capture: true,
    });
    if (!cliHelp.stdout.includes("Usage:") || !cliHelp.stdout.includes("getdesign <url>")) {
      throw new Error(`CLI help output did not contain usage text:\n${cliHelp.stdout}`);
    }

    const bunxHelp = run("bunx", ["--no-install", "getdesign", "--help"], {
      cwd: projectDir,
      capture: true,
    });
    if (!bunxHelp.stdout.includes("Usage:") || !bunxHelp.stdout.includes("getdesign <url>")) {
      throw new Error(`bunx help output did not contain usage text:\n${bunxHelp.stdout}`);
    }

    console.log(`npm package smoke passed in ${projectDir}`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

await main();
