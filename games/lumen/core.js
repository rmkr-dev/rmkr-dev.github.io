/* Lumen: level data, beam tracer and solver. Shared by the page and scripts/verify-lumen.mjs. */
(function (root) {
  "use strict";
  // Directions: 0 N, 1 E, 2 S, 3 W.
  var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
  // Reflection tables, indexed by travel direction. Orientation 0 is "/", 1 is "\".
  var REFLECT = [[1, 0, 3, 2], [3, 2, 1, 0]];
  var DIR_CH = { "^": 0, ">": 1, "v": 2, "<": 3 };
  var COLOR_CH = { r: 1, g: 2, b: 4 };

  // Level tokens (two characters per cell, space separated):
  //  ..  floor (pieces may be placed)     ##  wall      ::  glass (beam passes, no pieces)
  //  r>  emitter: colour r/g/b + facing ^ > v <
  //  T5  target needing exactly that colour mix (1 red, 2 green, 4 blue, sums mix)
  //  G4  colour gate: lets through only that colour
  //  F/ F%  fixed mirror ("%" stands for a backslash)    X/ X%  fixed splitter
  //  Q/ Q%  pivot mirror: turns in place but can't move
  //  M/ M%  movable mirror    S/ S%  movable splitter (half reflects, half passes)
  var TIERS = ["Reflect", "Split", "Spectrum", "Mastery"];
  var LEVELS = [
    { name: "First Light", tier: 0, par: 2, rows: [
      "r> .. .. .. .. ..",
      ".. .. .. .. .. ..",
      ".. .. .. .. .. ..",
      ".. .. .. .. T1 ..",
      ".. M/ .. .. .. .."],
      sol: [[0,4,"M",1]] },
    { name: "Corner Pocket", tier: 0, par: 3, rows: [
      ".. .. .. .. .. ..",
      "r> .. .. ## .. ..",
      ".. .. .. ## .. ..",
      ".. .. .. .. .. ..",
      ".. ## .. .. .. ..",
      ".. T1 .. M/ M/ .."],
      sol: [[1,2,"M",1],[5,2,"M",0]] },
    { name: "Dogleg", tier: 0, par: 4, rows: [
      "r> .. .. F% .. .. ..",
      ".. .. .. .. .. ## ..",
      ".. ## ## .. .. ## ..",
      ".. .. .. .. .. .. ..",
      ".. .. ## ## ## .. T1",
      "M/ M/ .. .. .. .. .."],
      sol: [[3,3,"M",1],[3,6,"M",1]] },
    { name: "Crosswinds", tier: 0, par: 6, rows: [
      ".. .. .. .. .. .. ..",
      "r> .. .. ## .. .. T1",
      ".. .. .. .. .. .. ..",
      ".. ## .. .. .. ## ..",
      ".. .. .. .. .. .. ..",
      "T1 .. .. ## .. .. r<",
      ".. M/ M/ .. M/ M/ .."],
      sol: [[1,2,"M",1],[5,2,"M",0],[5,4,"M",1],[1,4,"M",0]] },
    { name: "Pivot Hall", tier: 0, par: 3, rows: [
      "b> .. .. Q/ .. .. ..",
      ".. ## .. .. .. ## ..",
      ".. .. .. Q% .. .. ..",
      ".. ## .. ## .. ## ..",
      "T4 .. .. Q/ .. .. M/"],
      sol: [[2,0,"M",0],[0,3,"Q",1],[2,3,"Q",0],[4,3,"Q",0]] },
    { name: "Fork", tier: 1, par: 1, rows: [
      ".. .. .. T1 .. ..",
      ".. .. .. .. .. ..",
      "r> .. .. .. .. T1",
      ".. .. .. .. .. ..",
      ".. S/ .. .. .. .."],
      sol: [[2,3,"S",0]] },
    { name: "Trident", tier: 1, par: 5, rows: [
      ".. T1 .. .. .. .. ..",
      ".. .. .. ## .. .. ..",
      "r> .. .. .. .. .. ..",
      ".. .. .. ## .. .. ..",
      ".. .. .. .. .. .. T1",
      "## .. .. .. T1 .. ..",
      "S% S% M/ .. .. .. .."],
      sol: [[2,1,"S",0],[2,4,"S",1],[2,6,"M",1]] },
    { name: "Glasshouse", tier: 1, par: 5, rows: [
      ".. .. :: T1 :: .. ..",
      ".. .. :: .. :: .. ..",
      "r> .. :: .. :: .. ..",
      ".. .. .. .. .. .. ..",
      ":: :: .. ## .. :: ::",
      "T1 .. .. .. .. .. T1",
      ".. S/ .. S/ .. M/ M/"],
      sol: [[2,6,"M",1],[2,3,"S",0],[3,6,"S",0],[3,0,"M",0]] },
    { name: "Twin Engines", tier: 1, par: 3, rows: [
      "r> .. .. .. .. .. .. T1",
      ".. .. .. .. .. .. ## ..",
      "## .. .. .. .. ## .. ..",
      ".. T1 .. .. .. .. .. ..",
      ".. .. T1 .. ## .. ## ..",
      ".. .. .. ## .. .. .. ..",
      ".. .. .. .. .. .. .. r<",
      "S/ .. M% S% .. T1 .. .."],
      sol: [[0,2,"S",1],[6,1,"M",1],[6,5,"S",0]] },
    { name: "Hall of Mirrors", tier: 1, par: 3, rows: [
      ".. .. .. ## T1 ## .. .. ..",
      ".. Q% .. .. .. .. .. .. T4",
      ".. .. .. ## .. ## .. .. ..",
      "## .. ## .. .. .. ## .. ..",
      "r> .. .. .. X/ .. .. .. ..",
      "## .. ## .. .. .. ## .. ..",
      ".. .. .. ## .. ## .. .. ..",
      ".. .. .. .. T1 .. .. F/ ..",
      "M/ b^ .. ## .. ## .. .. S/"],
      sol: [[4,7,"M",1],[1,1,"Q",0],[8,8,"S",0]] },
    { name: "Violet", tier: 2, par: 3, rows: [
      ".. .. .. .. .. ..",
      "r> .. .. .. .. ..",
      ".. .. ## .. .. ..",
      ".. .. .. .. T5 ..",
      ".. .. .. .. .. ..",
      ".. b^ .. M/ M/ .."],
      sol: [[1,4,"M",1],[3,1,"M",0]] },
    { name: "Gatekeeper", tier: 2, par: 6, rows: [
      "r> .. .. .. ## .. ..",
      ".. .. .. .. G4 .. T4",
      ".. .. .. .. ## .. ..",
      ".. .. .. .. ## .. ..",
      ".. .. .. .. ## .. ..",
      ".. .. .. .. G1 .. T1",
      "b> .. .. .. ## .. ..",
      "M/ M/ .. M/ M/ .. .."],
      sol: [[0,1,"M",1],[1,3,"M",0],[5,1,"M",1],[6,3,"M",0]] },
    { name: "Crossfire", tier: 2, par: 2, rows: [
      ".. .. .. gv .. .. ..",
      ".. .. .. .. .. .. ..",
      "r> .. .. .. .. .. T2",
      ".. .. .. .. .. .. ..",
      ".. .. .. .. .. .. ..",
      ".. .. .. T1 .. .. ..",
      "M/ M/ M/ .. .. .. .."],
      sol: [[2,3,"M",1],[6,0,"M",0],[6,1,"M",0]] },
    { name: "White Room", tier: 2, par: 7, rows: [
      ".. .. .. gv .. .. ..",
      ".. .. .. .. .. .. ..",
      ".. .. .. ## .. ## ..",
      ".. .. .. T7 .. .. ..",
      ".. ## .. .. ## .. ..",
      "r> .. .. .. .. .. ..",
      ".. .. .. .. .. .. b<",
      "M% M/ M/ M% M% M% .."],
      sol: [[1,1,"M",0],[1,3,"M",0],[3,1,"M",1],[3,5,"M",1],[5,3,"M",0],[6,5,"M",1]] },
    { name: "Spectrum", tier: 2, par: 7, rows: [
      ".. .. .. ## .. .. .. ..",
      "r> .. .. .. .. .. .. ..",
      ".. .. .. .. .. .. .. ..",
      ".. .. .. .. .. .. .. T3",
      ".. .. ## .. .. ## .. ..",
      ".. .. .. .. .. .. .. T6",
      "M/ .. ## .. .. .. .. ..",
      "M/ M/ M% S% g^ M/ b> .."],
      sol: [[0,4,"M",0],[0,5,"M",0],[1,7,"M",1],[3,4,"M",0],[7,7,"M",0],[5,4,"S",0]] },
    { name: "Clockwork", tier: 3, par: 6, rows: [
      ".. .. .. ## .. .. ..",
      ".. Q% .. Q% .. .. T1",
      ".. .. .. .. .. ## ..",
      "r> .. .. X/ .. Q/ ..",
      ".. ## .. .. .. .. ..",
      ".. Q% .. .. .. Q% ..",
      ".. T1 .. T1 ## .. S%"],
      sol: [[5,3,"S",0],[1,1,"Q",1],[1,3,"Q",0],[3,5,"Q",1],[5,1,"Q",0],[5,5,"Q",0]] },
    { name: "Lighthouse", tier: 3, par: 3, rows: [
      ".. .. .. T1 .. .. ..",
      "T1 .. .. .. .. .. ..",
      "T1 .. .. .. .. .. ..",
      ".. ## .. .. .. .. ..",
      ".. .. .. .. .. .. T1",
      ".. .. .. .. .. ## ..",
      ".. .. .. r^ .. .. ..",
      "M/ S% S% .. S/ .. .."],
      sol: [[1,3,"S",1],[2,3,"S",1],[4,3,"S",0],[7,0,"M",0]] },
    { name: "Aurora", tier: 3, par: 9, rows: [
      ".. g> .. .. .. .. .. .. ..",
      ".. ## .. .. .. .. .. .. T4",
      "r> .. .. .. .. .. .. .. T1",
      ".. .. .. .. .. .. ## .. ..",
      ".. .. .. .. T7 .. .. .. ..",
      ".. .. ## .. .. .. ## .. ..",
      ".. .. .. .. .. .. .. .. b<",
      ".. .. ## .. .. .. .. .. ..",
      "M/ M/ S/ M% M/ S% .. .. .."],
      sol: [[0,4,"M",1],[1,7,"M",0],[2,2,"S",1],[4,2,"M",1],[6,4,"M",1],[6,7,"S",1]] },
    { name: "Prism Engine", tier: 3, par: 6, rows: [
      "r> .. .. .. .. G1 .. .. T1",
      ".. ## .. .. .. .. .. ## ..",
      ".. .. .. .. ## .. .. G4 ..",
      ".. .. .. .. .. G1 .. .. T5",
      "b> .. .. G4 .. .. .. .. T4",
      ".. ## .. .. ## .. .. ## ..",
      ".. .. .. .. .. .. .. .. ..",
      ".. ## .. .. ## .. ## .. ..",
      "S/ M/ M/ M% S% .. .. .. .."],
      sol: [[0,2,"S",1],[2,6,"M",0],[2,8,"M",1],[3,2,"M",1],[4,6,"S",0]] }
  ];

  function parse(def) {
    var rows = def.rows.map(function (r) { return r.trim().split(/\s+/); });
    var R = rows.length, C = rows[0].length;
    var lv = { name: def.name, tier: def.tier, par: def.par, R: R, C: C, cells: [], emitters: [], targets: [], pieces: [] };
    for (var r = 0; r < R; r++) {
      if (rows[r].length !== C) throw new Error(def.name + ": ragged row " + r);
      for (var c = 0; c < C; c++) {
        var t = rows[r][c], a = t[0], b = t[1], cell = { k: "floor" };
        var orient = b === "%" ? 1 : 0;
        if (t === "..") cell = { k: "floor" };
        else if (t === "##") cell = { k: "wall" };
        else if (t === "::") cell = { k: "glass" };
        else if (COLOR_CH[a] && DIR_CH[b] != null) { cell = { k: "emitter", color: COLOR_CH[a], dir: DIR_CH[b] }; lv.emitters.push({ r: r, c: c, color: cell.color, dir: cell.dir }); }
        else if (a === "T") { cell = { k: "target", need: +b }; lv.targets.push({ r: r, c: c, need: +b }); }
        else if (a === "G") cell = { k: "gate", color: +b };
        else if (a === "F") cell = { k: "fixed", type: "mirror", o: orient };
        else if (a === "X") cell = { k: "fixed", type: "split", o: orient };
        else if (a === "Q") lv.pieces.push({ r: r, c: c, type: "mirror", o: orient, move: false });
        else if (a === "M") lv.pieces.push({ r: r, c: c, type: "mirror", o: orient, move: true });
        else if (a === "S") lv.pieces.push({ r: r, c: c, type: "split", o: orient, move: true });
        else throw new Error(def.name + ": bad token " + t);
        lv.cells.push(cell);
      }
    }
    return lv;
  }

  // Trace every emitter. pieces: [{r,c,type,o}]. Returns segments for drawing,
  // the colour mix arriving at each target, the set of cells beams cross, and solved.
  function trace(lv, pieces) {
    var R = lv.R, C = lv.C, n = R * C, occ = new Array(n), i;
    for (i = 0; i < pieces.length; i++) occ[pieces[i].r * C + pieces[i].c] = pieces[i];
    var hit = {}, lit = new Uint8Array(n), segs = [], seen = {};
    for (var e = 0; e < lv.emitters.length; e++) {
      var em = lv.emitters[e];
      var stack = [[em.r, em.c, em.dir]];
      while (stack.length) {
        var s = stack.pop(), r = s[0], c = s[1], d = s[2], sr = r, sc = c;
        for (var guard = 0; guard < 4 * n + 4; guard++) {
          var nr = r + DR[d], nc = c + DC[d];
          if (nr < 0 || nc < 0 || nr >= R || nc >= C) { segs.push([em.color, sr, sc, nr, nc, 0]); break; }
          r = nr; c = nc;
          var idx = r * C + c, key = em.color + ":" + idx + ":" + d;
          if (seen[key]) { segs.push([em.color, sr, sc, r, c, 1]); break; }
          seen[key] = 1;
          lit[idx] |= em.color;
          var cell = lv.cells[idx], p = occ[idx];
          if (p || cell.k === "fixed") {
            var type = p ? p.type : cell.type, o = p ? p.o : cell.o;
            segs.push([em.color, sr, sc, r, c, 1]);
            var nd = REFLECT[o][d];
            stack.push([r, c, nd]);
            if (type === "split") stack.push([r, c, d]);
            break;
          }
          if (cell.k === "wall" || cell.k === "emitter") { segs.push([em.color, sr, sc, r, c, 2]); break; }
          if (cell.k === "target") { hit[idx] = (hit[idx] || 0) | em.color; segs.push([em.color, sr, sc, r, c, 1]); break; }
          if (cell.k === "gate" && !(cell.color & em.color)) { segs.push([em.color, sr, sc, r, c, 2]); break; }
        }
      }
    }
    var solved = true, states = [];
    for (i = 0; i < lv.targets.length; i++) {
      var t = lv.targets[i], got = hit[t.r * C + t.c] || 0;
      states.push(got);
      if (got !== t.need) solved = false;
    }
    return { segs: segs, targets: states, lit: lit, solved: solved };
  }

  function placeable(lv, r, c) { return lv.cells[r * lv.C + c].k === "floor"; }

  // Search for placements that solve the level. Beams only care about pieces
  // they touch, so each step places a spare piece on a floor cell a beam
  // crosses; spare pieces left over are parked on dark floor cells.
  function solve(lv, opts) {
    opts = opts || {};
    var limit = opts.limit || 4000000;
    var pivots = lv.pieces.filter(function (p) { return !p.move; });
    var movers = lv.pieces.filter(function (p) { return p.move; });
    var types = movers.map(function (p) { return p.type; }).sort();
    var best = null, nodes = 0, memo = {};
    function costOf(placed, pv, parked) {
      var cost = 0, i;
      for (i = 0; i < pivots.length; i++) if (pv[i] !== pivots[i].o) cost++;
      // Assign start pieces to final spots of the same type (brute force).
      var finals = placed.concat(parked);
      var bestA = Infinity, used = new Array(finals.length);
      (function rec(k, acc) {
        if (acc >= bestA) return;
        if (k === movers.length) { bestA = acc; return; }
        var m = movers[k];
        for (var j = 0; j < finals.length; j++) {
          if (used[j] || finals[j].type !== m.type) continue;
          var f = finals[j], cst;
          if (f.park) cst = f.r === m.r && f.c === m.c ? 0 : 1;
          else cst = (f.r === m.r && f.c === m.c ? 0 : 1) + (f.o === m.o ? 0 : 1);
          used[j] = true; rec(k + 1, acc + cst); used[j] = false;
        }
      })(0, 0);
      return cost + bestA;
    }
    function tryParked(placed, pv, rest, res) {
      // Park spares: keep them where they start if that spot is dark and free, else any dark free floor.
      var taken = {}, i, parked = [];
      placed.forEach(function (p) { taken[p.r * lv.C + p.c] = 1; });
      pivots.forEach(function (p) { taken[p.r * lv.C + p.c] = 1; });
      var restLeft = rest.slice();
      movers.forEach(function (m) {
        var k = restLeft.indexOf(m.type), idx = m.r * lv.C + m.c;
        if (k >= 0 && !taken[idx] && !res.lit[idx]) { restLeft.splice(k, 1); taken[idx] = 1; parked.push({ r: m.r, c: m.c, type: m.type, o: m.o, park: true }); }
      });
      for (i = 0; i < lv.R * lv.C && restLeft.length; i++) {
        if (taken[i] || res.lit[i] || lv.cells[i].k !== "floor") continue;
        taken[i] = 1;
        parked.push({ r: Math.floor(i / lv.C), c: i % lv.C, type: restLeft.shift(), o: 0, park: true });
      }
      if (restLeft.length) return null;
      return parked;
    }
    function full(placed, pv, parked) {
      var all = placed.slice();
      pivots.forEach(function (p, i) { all.push({ r: p.r, c: p.c, type: p.type, o: pv[i] }); });
      if (parked) parked.forEach(function (p) { all.push(p); });
      return all;
    }
    function dfs(placed, pv, rest) {
      if (++nodes > limit) return;
      var key = pv.join("") + "|" + placed.map(function (p) { return p.r + "," + p.c + p.type[0] + p.o; }).sort().join(";");
      if (memo[key]) return;
      memo[key] = 1;
      var res = trace(lv, full(placed, pv, null));
      if (res.solved) {
        var parked = tryParked(placed, pv, rest, res);
        if (parked) {
          var all = full(placed, pv, parked);
          if (trace(lv, all).solved) {
            var cost = costOf(placed, pv, parked);
            if (!best || cost < best.cost) best = { cost: cost, pieces: all, placed: placed.length };
          }
        }
      }
      if (!rest.length) return;
      var occ = {};
      placed.forEach(function (p) { occ[p.r * lv.C + p.c] = 1; });
      pivots.forEach(function (p) { occ[p.r * lv.C + p.c] = 1; });
      var seenT = {};
      for (var t = 0; t < rest.length; t++) {
        if (seenT[rest[t]]) continue;
        seenT[rest[t]] = 1;
        var nextRest = rest.slice(0, t).concat(rest.slice(t + 1));
        for (var i = 0; i < res.lit.length; i++) {
          if (!res.lit[i] || occ[i] || lv.cells[i].k !== "floor") continue;
          for (var o = 0; o < 2; o++) {
            dfs(placed.concat([{ r: Math.floor(i / lv.C), c: i % lv.C, type: rest[t], o: o }]), pv, nextRest);
          }
        }
      }
    }
    for (var mask = 0; mask < (1 << pivots.length); mask++) {
      var pv = pivots.map(function (p, i) { return (mask >> i) & 1; });
      dfs([], pv, types);
    }
    return { best: best, nodes: nodes, truncated: nodes > limit };
  }


  // Fewest drags and turns needed to go from the start layout to a solution
  // layout (pieces of one kind are interchangeable, so try every pairing).
  function solutionCost(lv, sol) {
    var cost = 0, movers = [], finals = [];
    lv.pieces.forEach(function (p) {
      if (!p.move) {
        var f = sol.filter(function (s) { return s[2] === "Q" && s[0] === p.r && s[1] === p.c; })[0];
        if (f && f[3] !== p.o) cost++;
      } else movers.push(p);
    });
    sol.forEach(function (s) { if (s[2] !== "Q") finals.push(s); });
    var best = Infinity, used = [];
    (function rec(k, acc) {
      if (acc >= best) return;
      if (k === movers.length) { best = acc; return; }
      var m = movers[k], want = m.type === "split" ? "S" : "M";
      for (var j = 0; j < finals.length; j++) {
        var f = finals[j];
        if (used[j] || f[2] !== want) continue;
        used[j] = true;
        rec(k + 1, acc + (f[0] === m.r && f[1] === m.c ? 0 : 1) + (f[3] === m.o ? 0 : 1));
        used[j] = false;
      }
    })(0, 0);
    return cost + best;
  }
  // Scripted check: the stored solution uses exactly the level's pieces,
  // leaves pivots where they are, sits on free floor and lights every target.
  function checkSolution(lv, sol) {
    var errs = [], seen = {}, i;
    var want = lv.pieces.map(function (p) { return p.move ? (p.type === "split" ? "S" : "M") : "Q@" + p.r + "," + p.c; }).sort().join();
    var got = sol.map(function (s) { return s[2] === "Q" ? "Q@" + s[0] + "," + s[1] : s[2]; }).sort().join();
    if (want !== got) errs.push("piece set differs");
    for (i = 0; i < sol.length; i++) {
      var s = sol[i], key = s[0] + "," + s[1];
      if (seen[key]) errs.push("two pieces on " + key);
      seen[key] = 1;
      if (s[2] !== "Q" && !placeable(lv, s[0], s[1])) errs.push("piece on non-floor " + key);
    }
    var pieces = sol.map(function (s) { return { r: s[0], c: s[1], type: s[2] === "S" ? "split" : "mirror", o: s[3] }; });
    if (!trace(lv, pieces).solved) errs.push("solution does not light every target");
    if (trace(lv, lv.pieces).solved) errs.push("level starts solved");
    return errs;
  }

  var api = { TIERS: TIERS, LEVELS: LEVELS, parse: parse, trace: trace, solve: solve, placeable: placeable, solutionCost: solutionCost, checkSolution: checkSolution, REFLECT: REFLECT, DR: DR, DC: DC };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LumenCore = api;
})(this);
