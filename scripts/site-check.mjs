#!/usr/bin/env node
/**
 * Site checks for rmkr-dev.github.io
 * - Validate skillbook/skills.json, promptbook/prompts.json, and games/quiz/questions.json
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
  if (!exists("games/index.html")) warn("Optional games/index.html not found");
  if (!exists("games/quiz/index.html")) fail("Missing games/quiz/index.html");
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

function kebab(s) {
  return typeof s === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
}

function isMixTopic(t) {
  return !!(t && (t.mix === true || t.combine === true));
}

function validateQuiz(rel) {
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
  if (data.$schema_name !== "rmkr-quiz") fail(`${rel}: expected $schema_name "rmkr-quiz"`);
  if (data.version !== 1) fail(`${rel}: expected version 1`);
  if (typeof data.storageKey !== "string" || !data.storageKey.startsWith("rmkr-game-")) {
    fail(`${rel}: storageKey must start with rmkr-game-`);
  }
  if (!Array.isArray(data.topics) || data.topics.length < 2) {
    fail(`${rel}: topics must be an array with at least 2 entries`);
    return;
  }
  if (!Array.isArray(data.levels) || data.levels.length < 1) {
    fail(`${rel}: levels must be a non-empty array`);
    return;
  }
  if (!Array.isArray(data.questions) || data.questions.length < 12) {
    fail(`${rel}: questions must be an array with at least 12 entries`);
    return;
  }

  const topicIds = new Set();
  const mixIds = new Set();
  data.topics.forEach((t, i) => {
    const label = `${rel} topics[${i}]`;
    if (!t || typeof t !== "object") {
      fail(`${label}: must be an object`);
      return;
    }
    if (!kebab(t.id)) fail(`${label}: id must be kebab-case`);
    if (typeof t.name !== "string" || !t.name.trim()) fail(`${label}: missing name`);
    if (t.id && topicIds.has(t.id)) fail(`${rel}: duplicate topic id "${t.id}"`);
    if (t.id) topicIds.add(t.id);
    if (isMixTopic(t)) mixIds.add(t.id);
  });
  if (!mixIds.size) fail(`${rel}: at least one topic must have mix:true (General)`);

  const levelIds = new Set();
  data.levels.forEach((lv, i) => {
    const label = `${rel} levels[${i}]`;
    if (!lv || typeof lv !== "object") {
      fail(`${label}: must be an object`);
      return;
    }
    if (!kebab(lv.id)) fail(`${label}: id must be kebab-case`);
    if (typeof lv.name !== "string" || !lv.name.trim()) fail(`${label}: missing name`);
    if (typeof lv.points !== "number" || lv.points < 0) fail(`${label}: points must be a number >= 0`);
    if (lv.id && levelIds.has(lv.id)) fail(`${rel}: duplicate level id "${lv.id}"`);
    if (lv.id) levelIds.add(lv.id);
  });

  if (data.defaultTopic && !topicIds.has(data.defaultTopic)) {
    fail(`${rel}: defaultTopic "${data.defaultTopic}" is not in topics`);
  }
  if (data.defaultLevel && !levelIds.has(data.defaultLevel)) {
    fail(`${rel}: defaultLevel "${data.defaultLevel}" is not in levels`);
  }

  const qids = new Set();
  const cells = new Map();
  data.questions.forEach((q, i) => {
    const label = `${rel} questions[${i}]`;
    if (!q || typeof q !== "object") {
      fail(`${label}: must be an object`);
      return;
    }
    if (!kebab(q.id)) fail(`${label}: id must be kebab-case`);
    if (q.id) {
      if (qids.has(q.id)) fail(`${rel}: duplicate question id "${q.id}"`);
      qids.add(q.id);
    }
    if (!topicIds.has(q.topic)) fail(`${label}: unknown topic "${q.topic}"`);
    if (mixIds.has(q.topic)) fail(`${label}: mix topic "${q.topic}" should not have its own questions`);
    if (!levelIds.has(q.level)) fail(`${label}: unknown level "${q.level}"`);
    if (typeof q.question !== "string" || !q.question.trim()) fail(`${label}: missing question`);
    if (!Array.isArray(q.options) || q.options.length < 2) {
      fail(`${label}: options must have at least 2 strings`);
    } else {
      const seen = new Set();
      for (const opt of q.options) {
        if (typeof opt !== "string" || !opt.trim()) fail(`${label}: options must be non-empty strings`);
        if (seen.has(opt)) fail(`${label}: duplicate option "${opt}"`);
        seen.add(opt);
      }
      if (typeof q.answer !== "string" || !seen.has(q.answer)) {
        fail(`${label}: answer must match one of the options exactly`);
      }
    }
    if (typeof q.hint !== "string" || !q.hint.trim()) fail(`${label}: missing hint`);
    if (typeof q.explain !== "string" || !q.explain.trim()) fail(`${label}: missing explain`);
    if (q.topic && q.level) {
      const key = q.topic + "/" + q.level;
      cells.set(key, (cells.get(key) || 0) + 1);
    }
  });

  for (const tid of topicIds) {
    if (mixIds.has(tid)) continue;
    for (const lid of levelIds) {
      const n = cells.get(tid + "/" + lid) || 0;
      if (n < 1) fail(`${rel}: no questions for topic "${tid}" level "${lid}"`);
    }
  }
}

function checkHtmlPages() {
  const tools = extractToolsFromSiteJs();
  const pages = new Set([
    "index.html",
    "profile.html",
    "ai/index.html",
    "games/index.html",
    "games/quiz/index.html",
    "skillbook/index.html",
    "promptbook/index.html"
  ]);
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
validateQuiz("games/quiz/questions.json");
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
console.log(`  skills/prompts/quiz validated; tool paths checked; ${warnings.length} warning(s).`);
