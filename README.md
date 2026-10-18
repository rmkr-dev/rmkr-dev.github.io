# RMKR Toolkit

Static, client-side developer utilities hosted at [rmkr-dev.github.io](https://rmkr-dev.github.io).

Every tool runs in the browser. Transforms, hashes, diffs, and previews stay on your machine. There is no backend and no telemetry that leaves the tab with your payloads.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

Skillbook and Promptbook load JSON over `fetch`, so use a local server (opening the HTML file via `file://` will not load the catalogs).

## Tools

### Transform

- **Payload Knife** — pretty/minify JSON, JSON to CSV, cURL to fetch
- **YAML ↔ JSON** — convert and format
- **CSV Convert** — CSV, JSON, and YAML
- **XML ↔ JSON** / **TOML ↔ JSON**
- **Encode / Decode** — Base64, URL, HTML entities
- **.env ↔ JSON**, **Query ↔ JSON**, **Headers Parser**

### Security

- **JWT Debugger**
- **Hash Lab** — SHA-256, SHA-1, MD5
- **UUID Generator**
- **PEM / SSH Viewer**
- **CIDR Calculator** — IPv4 network, broadcast, mask, host range
- **Azure Resource ID** — parse ARM IDs into subscription, RG, type, name

### Time

- **Time Overlay** — timezone working-hour grid
- **Unix Timestamp**
- **Cron Explainer**

### Data

- **Markdown Viewer**
- **Payload Diff**
- **Mock Generator**
- **JSON Schema Studio**
- **Regex Tester**
- **SQL Formatter**
- **Markdown Table**

### Design

- **Architect Draw**
- **Color Converter**
- **QR Code**
- **Sample Data**
- **Slugify**

### Dev helpers

- **Roadmap Planner** (saved in localStorage)
- **Collab Pad** (peer-to-peer scratch pad)
- **Number Base**
- **Local Stats** (counts stored only in this browser)


### Focus Games

Lightweight browser games for a quick break. No accounts, no ads, and scores stay in `localStorage` only. No sound effects by default.

The home page lists one **Games Hub** card (`games/`). Individual games live on that hub (not as separate home cards):

- **Memory Match** (`games/memory/`) — flip cards, find pairs; best move count
- **Sequence Recall** (`games/sequence/`) — Simon-lite pads; best level reached
- **Number Slide** (`games/numbers/`) — 15-puzzle on a 4×4 board; best move count
- **Word Scramble** (`games/words/`) — unscramble a common word; best streak
- **Reaction Tap** (`games/reaction/`) — wait for gold, tap fast; best average ms
- **Tap Order** (`games/order/`) — tap 1–9 in order on a 3×3 grid; best time
- **Color Clash** (`games/colors/`) — Stroop-style: tap the ink color, not the word; best streak
- **Odd One Out** (`games/odd/`) — four tiles, three match; tap the different shape or color; best streak
- **Higher or Lower** (`games/higher/`) — guess if the next number is higher or lower; best streak
- **Quick Math** (`games/math/`) — mental arithmetic; tap the right answer; best streak
- **Find Number** (`games/find/`) — spot the target number in a 4×4 grid; best streak
- **Pop Light** (`games/pop/`) — tap the gold cell on a 3×3 grid before it fades; best streak
- **Sum Pair** (`games/sum/`) — tap the one pair of numbers that adds to the target; best streak
- **Missing Number** (`games/missing/`) — fill the blank in a short +1/+2/+3 sequence; best streak
- **Even or Odd** (`games/even/`) — say whether a number from 1–99 is even or odd; best streak
- **Count the Dots** (`games/dots/`) — 3–9 dots flash briefly; tap the count (flash shortens as the streak grows); best streak
- **Middle Arrow** (`games/arrow/`) — tap the direction of the middle arrow while ignoring the flankers; time limit tightens with the streak; best streak
- **Same as Last** (`games/same/`) — shapes appear one at a time; tap Same or Different versus the previous shape; best streak
- **Light Recall** (`games/recall/`) — a few cells flash gold; tap every one you saw; one more cell per level, 3×3 growing to 4×4; best level
- **Go Stop** (`games/stop/`) — tap on GO, hold still on STOP; time window tightens with the streak; best streak
- **Turned or Flipped** (`games/turn/`) — reference vs probe shape; tap whether the probe is rotated or mirrored; best streak
- **Spot the Change** (`games/change/`) — a grid of shapes blinks off and returns with one cell changed in shape or color; tap it; 3×3 growing to 4×4, look time shrinks with the streak; best streak
- **More Dots** (`games/more/`) — two panels of dots; tap Left, Equal, or Right for the side with more; counts get closer and view time shrinks with the streak; best streak
- **Glow Grid** (`games/glow/`) — 12-level logic puzzle from 3×3 to 5×5; each tap flips a cell and its four neighbours, light every cell; par-move and time bonuses, pause and restart; best total score
- **Echo Path** (`games/echo/`) — staged memory game; watch a path of adjacent cells light up, then trace it in order; one step longer per stage, grid grows 3×3 → 5×5, three lives, combo multiplier up to ×5, pause and restart; best score
- **Number Forge** (`games/forge/`) — target-number puzzle; tap a tile, a sign, and a second tile to merge them, and make the target; Journey runs 15 puzzles over 5 tiers (3 → 5 tiles, × then ÷ unlock, 3 skips), Blitz is 2 minutes (+5s per solve); par and speed bonuses, clean-streak bonus, undo/reset/hint, results summary; best score per mode
- **Circuit Link** (`games/circuit/`) — rotate-the-tiles wiring puzzle; tap tiles to turn them until every tile is fed from the gold core with no loose ends; Journey runs 12 circuits over 4 tiers (4×4, 5×5, 6×6, 6×8, 3 skips), Blitz is 3 minutes (+10s per solve), Daily is one date-seeded 6×6 board; turn-direction toggle, lock mode, undo/reset/hint, par-tap and speed bonuses, clean-streak bonus, results summary; best score per mode

#### Casual Quiz (unlisted)

**Casual Quiz** (`games/quiz/`) is no longer linked from the Games Hub, but the page still works at its URL. Multiple-choice on India, Tamil Nadu, science, technology, and more, plus a General mix. Marks stay in `localStorage`. Questions live only in `games/quiz/questions.json`.

#### How to add or change quiz questions

Edit `games/quiz/questions.json` only. The page reads topics, levels, and questions from that file.

1. **New question** — append an object to `questions` with unique kebab-case `id`, existing `topic` and `level` ids, `question`, `options` (2+ strings), `answer` (must match one option exactly), `hint`, and `explain`.
2. **New topic** — append `{ "id": "my-topic", "name": "My Topic", "blurb": "…" }` to `topics`, then add questions with `"topic": "my-topic"`. A topic with `"mix": true` (General) automatically includes every other topic — do not add questions to a mix topic.
3. **New level** — append `{ "id": "expert", "name": "Expert", "points": 4 }` to `levels`, then tag questions with that `level`. Optional per-question `"points"` overrides the level value.
4. Run `node scripts/site-check.mjs` before opening a PR.

### AI

Instruction packs and prompts for **GitHub Copilot**, **Claude Code**, and **Codex** only (no other agent runtimes are documented here).

- **Skillbook** (`skillbook/`) — browsable, searchable skills with when-to-use, tool targets, format notes, and a working Copy button. Data: `skillbook/skills.json`.
- **Promptbook** (`promptbook/`) — same UX for task prompts. Data: `promptbook/prompts.json`.
- **AI hub** (`ai/`) — thin landing page linking both.

#### How to add a skill or prompt

1. Append an object to the `skills` array in `skillbook/skills.json` or the `prompts` array in `promptbook/prompts.json`.
2. Required fields: `id` (unique kebab-case), `title`, `whenToUse`, `tools` (subset of `copilot` | `claude-code` | `codex`), `tags` (string array), `formatNotes`, `body` (the pasteable text).
3. Keep bodies original and practical. Note where each tool expects the text:
   - Copilot → `.github/copilot-instructions.md` or path-scoped `*.instructions.md`
   - Claude Code → `CLAUDE.md` for short facts; `.claude/skills/<name>/SKILL.md` for procedures
   - Codex → `AGENTS.md` (nested / override files as needed)
4. Run `node scripts/site-check.mjs` before opening a PR.

## Site checks

GitHub Actions workflow `.github/workflows/site-checks.yml` runs on pull requests and pushes to `main`:

- Validates Skillbook / Promptbook / Casual Quiz JSON shape
- Ensures every tool path listed in `assets/site.js` has a matching `index.html`
- Basic HTML well-formedness for tool pages

```bash
node scripts/site-check.mjs
```

## Notes

- Shared chrome lives in `assets/site.css` and `assets/site.js`.
- Game pages put `class="game-page"` on `<body>`; `site.css` uses it for mobile tap handling (no double-tap zoom, no tap text selection, 44px tap targets).
- Small libraries used by a few tools are vendored under `assets/vendor/`.
- Existing tool URLs (`/md`, `/jwt`, `/transform`, and the rest) are unchanged.
- New pages set `data-root` and `data-tool` so the shared nav/footer inject correctly.
