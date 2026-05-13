#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const registryPath = path.join(rootDir, "ai_skills/registry.json");
const checkOnly = process.argv.includes("--check");
const generatedNotice = "Generated from `ai_skills/registry.json`. Do not edit manually.";

const toolNames = ["opencode", "cursor", "github"];

function yamlString(value) {
  return JSON.stringify(value);
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function requiredString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }

  return value;
}

function resolveRoutePath(registry, skill, toolName) {
  const explicitRoute = skill.routes?.[toolName];
  if (explicitRoute) {
    return explicitRoute;
  }

  const routePattern = registry.tools?.[toolName]?.routePattern;
  return requiredString(routePattern, `tools.${toolName}.routePattern`).replace(
    "{skill}",
    skill.name,
  );
}

function relativeCanonicalPath(routePath, canonicalPath) {
  const routeDirectory = path.dirname(path.join(rootDir, routePath));
  const canonicalFile = path.join(rootDir, canonicalPath);
  let relativePath = toPosixPath(path.relative(routeDirectory, canonicalFile));

  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

function routeBody(routePath, canonicalPath) {
  const relativePath = relativeCanonicalPath(routePath, canonicalPath);

  return `${generatedNotice}\n\nCanonical skill: \`${relativePath}\`.\n\nLoad and follow the canonical skill before changing code. Keep this file as routing only.\n`;
}

function opencodeRoute(skill, routePath) {
  return `---\nname: ${yamlString(skill.name)}\ndescription: ${yamlString(skill.description)}\n---\n\n${routeBody(routePath, skill.canonicalPath)}`;
}

function cursorRoute(skill, routePath) {
  const cursorConfig = skill.toolConfig?.cursor ?? {};

  if (cursorConfig.alwaysApply !== false) {
    throw new Error(`${skill.name}: toolConfig.cursor.alwaysApply must be false.`);
  }

  return `---\ndescription: ${yamlString(skill.description)}\nglobs: ${yamlString(requiredString(cursorConfig.globs, `${skill.name}.toolConfig.cursor.globs`))}\nalwaysApply: false\n---\n\n${routeBody(routePath, skill.canonicalPath)}`;
}

function githubRoute(skill, routePath) {
  const githubConfig = skill.toolConfig?.github ?? {};

  return `---\napplyTo: ${yamlString(requiredString(githubConfig.applyTo, `${skill.name}.toolConfig.github.applyTo`))}\n---\n\n${routeBody(routePath, skill.canonicalPath)}`;
}

function buildRoute(registry, skill, toolName) {
  const routePath = resolveRoutePath(registry, skill, toolName);

  if (toolName === "opencode") {
    return { content: opencodeRoute(skill, routePath), routePath };
  }

  if (toolName === "cursor") {
    return { content: cursorRoute(skill, routePath), routePath };
  }

  if (toolName === "github") {
    return { content: githubRoute(skill, routePath), routePath };
  }

  throw new Error(`Unsupported tool: ${toolName}`);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validateSkill(skill, seenNames) {
  requiredString(skill.name, "skills[].name");
  requiredString(skill.description, `${skill.name}.description`);
  requiredString(skill.canonicalPath, `${skill.name}.canonicalPath`);

  if (seenNames.has(skill.name)) {
    throw new Error(`Duplicate skill name: ${skill.name}`);
  }

  seenNames.add(skill.name);

  const canonicalFile = path.join(rootDir, skill.canonicalPath);
  if (!(await fileExists(canonicalFile))) {
    throw new Error(`${skill.name}: canonical skill does not exist at ${skill.canonicalPath}`);
  }
}

async function readRegistry() {
  const registry = JSON.parse(await readFile(registryPath, "utf8"));

  if (!Array.isArray(registry.skills)) {
    throw new Error("registry.skills must be an array.");
  }

  const seenNames = new Set();
  for (const skill of registry.skills) {
    await validateSkill(skill, seenNames);
  }

  return registry;
}

async function readExisting(routePath) {
  try {
    return await readFile(path.join(rootDir, routePath), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function syncRoute(routePath, expectedContent, staleRoutes) {
  const currentContent = await readExisting(routePath);

  if (currentContent === expectedContent) {
    return;
  }

  if (checkOnly) {
    staleRoutes.push(routePath);
    return;
  }

  const absolutePath = path.join(rootDir, routePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, expectedContent);
}

async function main() {
  const registry = await readRegistry();
  const staleRoutes = [];

  for (const skill of registry.skills) {
    for (const toolName of toolNames) {
      const { content, routePath } = buildRoute(registry, skill, toolName);
      await syncRoute(routePath, content, staleRoutes);
    }
  }

  if (staleRoutes.length > 0) {
    throw new Error(
      `AI skill route files are out of sync. Run npm run ai-skills:sync. Outdated files: ${staleRoutes.join(", ")}`,
    );
  }

  const mode = checkOnly ? "checked" : "synced";
  console.log(
    `AI skill routes ${mode}: ${registry.skills.length} skills, ${toolNames.length} tools.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
