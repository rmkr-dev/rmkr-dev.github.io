#!/usr/bin/env node
/**
 * Lumen (games/lumen/) level check.
 * For every level: the stored solution uses exactly the level's pieces and
 * lights every target, the level does not start solved, and par equals the
 * fewest moves to reach that solution. A bounded independent search then
 * tries to solve each level from scratch as a second opinion.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const L = require(path.join(root, "games/lumen/core.js"));
let failed = 0;
L.LEVELS.forEach((def, i) => {
  const lv = L.parse(def);
  const errs = L.checkSolution(lv, def.sol);
  const cost = L.solutionCost(lv, def.sol);
  if (cost !== def.par) errs.push(`par ${def.par} but stored solution takes ${cost}`);
  const s = L.solve(lv, { limit: 150000 });
  const search = s.best ? `search solved (${s.best.cost} moves)` : s.truncated ? "search budget hit" : "search found none";
  if (!s.best && !s.truncated) errs.push("exhaustive search found no solution");
  console.log(`${String(i + 1).padStart(2)} ${def.name.padEnd(16)} ${L.TIERS[def.tier].padEnd(9)} par ${def.par}  ${errs.length ? "FAIL " + errs.join("; ") : "ok"}  · ${search}`);
  if (errs.length) failed++;
});
console.log(failed ? `${failed} level(s) failed` : `All ${L.LEVELS.length} levels verified solvable.`);
process.exit(failed ? 1 : 0);
