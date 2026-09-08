#!/usr/bin/env node
/**
 * Site checks for rmkr-dev.github.io
 * - Validate skillbook/skills.json and promptbook/prompts.json
 * - Ensure every tool path in assets/site.js has index.html
 * - Basic HTML well-formedness for key pages
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

const ALLOWED_TOOLS = new Set(["copilot", "claude-code", "codex"]);

function validateEntry(kind, item, idx) {
  const label = `${kind}[${idx}]`;
  if (!item || typeof item !== "object") {
    fail(`${label}: must be an object`);
    return;
  }
  for (const key of ["id", "title", "whenToUse", "formatNotes", "body"]) {
    if (typeof item[key] !== "string" || !item[key].trim()) {
      fail(`${label}: missing non-empty string "${key}"`);
    }
  }
  if (item.id && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) {
    fail(`${label}: id must be kebab-case (${item.id})`);
  }
  if (!Array.isArray(item.tools) || item.tools.length === 0) {
    fail(`${label}: tools must be a non-empty array`);
  } else {
    for (const t of item.tools) {
      if (!ALLOWED_TOOLS.has(t)) fail(`${label}: unknown tool "${t}"`);
    }
  }
  if (!Array.isArray(item.tags)) {
    fail(`${label}: tags must be an array`);
  }
}

function validateBook(rel, listKey, schemaName) {
  if (!exists(rel)) {
    fail(`Missing ${rel}`);
    return;
  }
  let data;
  try {
    data = JSON.parse(read(rel));
  } catch (e) {
    fail(`${rel}: invalid JSON (${e.message})`);
    return;
  }
  if (data.$schema_name !== schemaName) {
    fail(`${rel}: expected $schema_name "${schemaName}"`);
  }
  if (data.version !== 1) {
    fail(`${rel}: expected version 1`);
  }
  if (!Array.isArray(data.targets) || data.targets.join(",") !== "copilot,claude-code,codex") {
    fail(`${rel}: targets must be ["copilot","claude-code","codex"]`);
  }
  const list = data[listKey];
  if (!Array.isArray(list) || list.length < 6) {
    fail(`${rel}: ${listKey} must be an array with at least 6 entries`);
    return;
  }
  const ids = new Set();
  list.forEach((item, i) => {
    validateEntry(rel + "#" + listKey, item, i);
    if (item && item.id) {
      if (ids.has(item.id)) fail(`${rel}: duplicate id "${item.id}"`);
      ids.add(item.id);
    }
  });
}

function extractToolsFromSiteJs() {
  const src = read("assets/site.js");
  const tools = [];
  const re = /\{\s*id:\s*"([^"]+)"\s*,\s*path:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    tools.push({ id: m[1], path: m[2] });
  }
  if (!tools.length) fail("assets/site.js: could not parse TOOLS entries");
  return tools;
}

function checkToolPages() {
  const tools = extractToolsFromSiteJs();
  for (const t of tools) {
    const rel = path.posix.join(t.path.replace(/\/?$/, "/"), "index.html");
    if (!exists(rel)) fail(`Tool "${t.id}" path "${t.path}" missing ${rel}`);
  }
  // Optional hub
  if (!exists("ai/index.html")) warn("Optional ai/index.html not found");
}

function basicHtmlCheck(rel) {
  if (!exists(rel)) return;
  const html = read(rel);
  if (!/<!DOCTYPE html>/i.test(html)) fail(`${rel}: missing <!DOCTYPE html>`);
  if (!/<html[\s>]/i.test(html)) fail(`${rel}: missing <html>`);
  if (!/<head[\s>]/i.test(html)) fail(`${rel}: missing <head>`);
  if (!/<body[\s>]/i.test(html)) fail(`${rel}: missing <body>`);
  if (!/<\/html>/i.test(html)) fail(`${rel}: missing </html>`);
  if (!/<\/body>/i.test(html)) fail(`${rel}: missing </body>`);
  if (!/data-root=/.test(html)) warn(`${rel}: no data-root attribute (chrome prefix may be wrong)`);
  if (!/data-tool=/.test(html)) warn(`${rel}: no data-tool attribute`);
  const opens = (html.match(/<[a-zA-Z][^>]*>/g) || []).length;
  const closes = (html.match(/<\/[a-zA-Z]+>/g) || []).length;
  if (closes < opens * 0.35) warn(`${rel}: unusually few closing tags (opens=${opens}, closes=${closes})`);
}

function checkHtmlPages() {
  const tools = extractToolsFromSiteJs();
  const pages = new Set(["index.html", "profile.html", "ai/index.html", "skillbook/index.html", "promptbook/index.html"]);
  for (const t of tools) {
    pages.add(path.posix.join(t.path.replace(/\/?$/, "/"), "index.html"));
  }
  for (const rel of [...pages].sort()) {
    if (exists(rel)) basicHtmlCheck(rel);
  }
}

function checkSiteJsSyntax() {
  const src = read("assets/site.js");
  // Apostrophe in brand string must stay escaped
  if (src.includes("Ramkumar's") && !src.includes("Ramkumar\\'s") && !src.includes('Ramkumar\\\'s')) {
    // template in source uses escaped form inside single-quoted JS strings
  }
  if (/Ramkumar's <span>/.test(src) && !/Ramkumar\\'s/.test(src)) {
    fail("assets/site.js: unescaped apostrophe in Ramkumar's brand string");
  }
  try {
    // Soft parse: wrap as module not needed; Function constructor catches basic syntax errors
    // eslint-disable-next-line no-new-func
    new Function(src);
  } catch (e) {
    fail(`assets/site.js: JS syntax error (${e.message})`);
  }
}

validateBook("skillbook/skills.json", "skills", "rmkr-skillbook");
validateBook("promptbook/prompts.json", "prompts", "rmkr-promptbook");
checkSiteJsSyntax();
checkToolPages();
checkHtmlPages();

const { runCidrTests } = await import("./cidr-lib.test.mjs");
try {
  runCidrTests();
} catch (e) {
  fail(`cidr-lib tests: ${e.message}`);
}

const { runAzureIdTests } = await import("./azure-id-lib.test.mjs");
try {
  runAzureIdTests();
} catch (e) {
  fail(`azure-id-lib tests: ${e.message}`);
}

if (warnings.length) {
  console.log("Warnings:");
  for (const w of warnings) console.log("  - " + w);
}
if (errors.length) {
  console.error("Failures:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("site-check: OK");
console.log(`  skills/prompts validated; tool paths checked; ${warnings.length} warning(s).`);
