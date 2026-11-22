// Entry point for the gta6-meme-x-01-v22 submission.
//
// The grader runs `node /bot/main.ts` with the repo mounted read-only at
// /bot and an empty writable directory at /output. This program's only job
// is to deliver the post file: it copies POST.json from the repo root into
// the output directory, byte for byte. It writes nothing else.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function fail(message) {
  process.stderr.write(`main.ts: ${message}\n`);
  process.exit(1);
}

function resolveBotDir() {
  if (process.env.MAKEFUN_BOT_DIR) return process.env.MAKEFUN_BOT_DIR;
  return dirname(fileURLToPath(import.meta.url));
}

function resolveOutputDir() {
  if (process.env.MAKEFUN_OUTPUT_DIR) return process.env.MAKEFUN_OUTPUT_DIR;
  return "/output";
}

function main() {
  const botDir = resolveBotDir();
  const outDir = resolveOutputDir();

  const postPath = join(botDir, "POST.json");
  const memePath = join(botDir, "meme.webp");

  if (!existsSync(postPath)) fail(`POST.json not found at ${postPath}`);
  if (!existsSync(memePath)) fail(`meme.webp not found at ${memePath}`);

  const bytes = readFileSync(postPath);

  // The post file must fit the gate's size limit.
  if (bytes.length > 16384) {
    fail(`POST.json is ${bytes.length} bytes, over the 16384 byte limit`);
  }

  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    fail("POST.json is not valid JSON");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof parsed.url !== "string" ||
    !/^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/[0-9]+/.test(parsed.url)
  ) {
    fail("POST.json does not contain a valid X post URL");
  }

  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "POST.json");
  copyFileSync(postPath, outPath);

  // Read the copy back and confirm it is byte-identical to the source.
  const copied = readFileSync(outPath);
  if (!copied.equals(bytes)) {
    fail("POST.json copy in output dir differs from the repo original");
  }
}

main();
