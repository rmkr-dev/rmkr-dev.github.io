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

Lightweight browser games for a quick break. No accounts, no ads, and scores stay in `localStorage` only. No sound effects in this first wave.

- **Games Hub** (`games/`) — landing page with links and short descriptions
- **Memory Match** (`games/memory/`) — flip cards, find pairs; best move count
- **Sequence Recall** (`games/sequence/`) — Simon-lite pads; best level reached
- **Number Slide** (`games/numbers/`) — 15-puzzle on a 4×4 board; best move count
- **Word Scramble** (`games/words/`) — unscramble a common word; best streak

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

- Validates Skillbook / Promptbook JSON shape
- Ensures every tool path listed in `assets/site.js` has a matching `index.html`
- Basic HTML well-formedness for tool pages

```bash
node scripts/site-check.mjs
```

## Notes

- Shared chrome lives in `assets/site.css` and `assets/site.js`.
- Small libraries used by a few tools are vendored under `assets/vendor/`.
- Existing tool URLs (`/md`, `/jwt`, `/transform`, and the rest) are unchanged.
- New pages set `data-root` and `data-tool` so the shared nav/footer inject correctly.
