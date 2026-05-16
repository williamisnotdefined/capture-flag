import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultDatabaseUrl =
  "postgresql://capture_flag:capture_flag@localhost:55433/capture_flag_e2e?schema=public";
const databaseUrl =
  process.env.E2E_DATABASE_URL ??
  (process.env.DATABASE_URL?.includes("e2e") ? process.env.DATABASE_URL : defaultDatabaseUrl);

if (!databaseUrl.includes("e2e")) {
  throw new Error("Refusing to prepare E2E database because DATABASE_URL does not contain e2e");
}

const scriptPath = fileURLToPath(import.meta.url);
const e2eRoot = path.resolve(path.dirname(scriptPath), "..");
const repoRoot = path.resolve(e2eRoot, "../..");
const prismaCli = path.join(repoRoot, "node_modules", "prisma", "build", "index.js");
const prismaSchema = path.join(repoRoot, "apps", "api", "prisma", "schema.prisma");
const env = { ...process.env, DATABASE_URL: databaseUrl };

run("npm", ["--workspace", "@capture-flag/shared", "run", "build"]);
run("npm", ["--workspace", "@capture-flag/evaluator", "run", "build"]);
run("npm", ["--workspace", "@capture-flag/sdk-js", "run", "build"]);
run(process.execPath, [prismaCli, "generate", "--schema", prismaSchema]);
await runWithRetry(process.execPath, [prismaCli, "migrate", "deploy", "--schema", prismaSchema]);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function runWithRetry(command, args) {
  const attempts = 30;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = spawnSync(command, args, {
      cwd: repoRoot,
      env,
      stdio: "inherit",
    });

    if (!result.error && result.status === 0) {
      return;
    }

    if (attempt === attempts) {
      if (result.error) {
        throw result.error;
      }

      process.exit(result.status ?? 1);
    }

    await sleep(1000);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
