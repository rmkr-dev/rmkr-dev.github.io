(function () {
  var CATS = ["Transform", "Security", "Time", "Data", "Design", "Dev helpers", "AI", "Focus Games"];

  var TOOLS = [
    { id: "transform", path: "transform/", name: "Payload Knife", blurb: "Pretty/minify JSON, JSON to CSV, and cURL to fetch.", cat: "Transform" },
    { id: "yaml", path: "yaml/", name: "YAML ↔ JSON", blurb: "Convert YAML and JSON, then pretty-print or minify.", cat: "Transform" },
    { id: "csv", path: "csv/", name: "CSV Convert", blurb: "CSV to JSON or YAML, and JSON arrays back to CSV.", cat: "Transform" },
    { id: "xml", path: "xml/", name: "XML ↔ JSON", blurb: "Turn XML into JSON and JSON back into XML.", cat: "Transform" },
    { id: "toml", path: "toml/", name: "TOML ↔ JSON", blurb: "Parse and emit common TOML documents.", cat: "Transform" },
    { id: "encode", path: "encode/", name: "Encode / Decode", blurb: "Base64, URL, and HTML entity encode or decode.", cat: "Transform" },
    { id: "env", path: "env/", name: ".env ↔ JSON", blurb: "Convert dotenv files to JSON and back.", cat: "Transform" },
    { id: "query", path: "query/", name: "Query ↔ JSON", blurb: "Parse and build URL query strings.", cat: "Transform" },
    { id: "headers", path: "headers/", name: "Headers Parser", blurb: "Turn raw HTTP headers into JSON.", cat: "Transform" },
    { id: "jwt", path: "jwt/", name: "JWT Debugger", blurb: "Decode JWT header and payload locally.", cat: "Security" },
    { id: "hash", path: "hash/", name: "Hash Lab", blurb: "SHA-256, SHA-1, and MD5 hashes in the browser.", cat: "Security" },
    { id: "uuid", path: "uuid/", name: "UUID Generator", blurb: "Create v4 UUIDs in bulk and copy them.", cat: "Security" },
    { id: "cert", path: "cert/", name: "PEM / SSH Viewer", blurb: "Inspect PEM blocks and SSH key fingerprints.", cat: "Security" },
    { id: "cidr", path: "cidr/", name: "CIDR Calculator", blurb: "Network, broadcast, mask, and host range from an IPv4 CIDR.", cat: "Security" },
    { id: "azure-id", path: "azure-id/", name: "Azure Resource ID", blurb: "Split subscription, resource group, type, and name from an ARM ID.", cat: "Security" },
    { id: "time", path: "time/", name: "Time Overlay", blurb: "Compare working hours across time zones.", cat: "Time" },
    { id: "timestamp", path: "timestamp/", name: "Unix Timestamp", blurb: "Convert Unix time to human dates and back.", cat: "Time" },
    { id: "cron", path: "cron/", name: "Cron Explainer", blurb: "Read cron expressions and preview next runs.", cat: "Time" },
    { id: "md", path: "md/", name: "Markdown Viewer", blurb: "Preview Markdown and export a PDF.", cat: "Data" },
    { id: "diff", path: "diff/", name: "Payload Diff", blurb: "Compare two texts or JSON payloads side by side.", cat: "Data" },
    { id: "mock", path: "mock/", name: "Mock Generator", blurb: "Build sample JSON records from field names.", cat: "Data" },
    { id: "json-schema", path: "json-schema/", name: "JSON Schema Studio", blurb: "Infer a schema and visualize JSON structure.", cat: "Data" },
    { id: "regex", path: "regex/", name: "Regex Tester", blurb: "Test patterns, groups, and replacements live.", cat: "Data" },
    { id: "sql", path: "sql/", name: "SQL Formatter", blurb: "Pretty-print common SQL statements.", cat: "Data" },
    { id: "table", path: "table/", name: "Markdown Table", blurb: "Turn CSV or TSV into a Markdown table.", cat: "Data" },
    { id: "draw", path: "draw/", name: "Architect Draw", blurb: "Sketch diagrams on a local whiteboard.", cat: "Design" },
    { id: "color", path: "color/", name: "Color Converter", blurb: "Convert hex, RGB, and HSL with a live swatch.", cat: "Design" },
    { id: "qr", path: "qr/", name: "QR Code", blurb: "Generate a QR code from any text.", cat: "Design" },
    { id: "lorem", path: "lorem/", name: "Sample Data", blurb: "Lorem text, names, and fake records.", cat: "Design" },
    { id: "slug", path: "slug/", name: "Slugify", blurb: "Make URL-safe slugs from titles.", cat: "Design" },
    { id: "roadmap", path: "roadmap/", name: "Roadmap Planner", blurb: "Plan quarters and keep the board in this browser.", cat: "Dev helpers" },
    { id: "collab", path: "collab/", name: "Collab Pad", blurb: "Peer-to-peer scratch pad for a shared session.", cat: "Dev helpers" },
    { id: "base", path: "base/", name: "Number Base", blurb: "Convert between binary, octal, decimal, and hex.", cat: "Dev helpers" },
    { id: "stats", path: "stats/", name: "Local Stats", blurb: "See tool opens stored only in this browser.", cat: "Dev helpers" },
    { id: "skillbook", path: "skillbook/", name: "Skillbook", blurb: "Reusable skills for Copilot, Claude Code, and Codex.", cat: "AI" },
    { id: "promptbook", path: "promptbook/", name: "Promptbook", blurb: "Ready-to-paste prompts for the same three tools.", cat: "AI" },
    { id: "games", path: "games/", name: "Games Hub", blurb: "Simple focus games that run fully in your browser.", cat: "Focus Games" },
    { id: "memory", path: "games/memory/", name: "Memory Match", blurb: "Flip cards and find matching pairs.", cat: "Focus Games" },
    { id: "sequence", path: "games/sequence/", name: "Sequence Recall", blurb: "Watch the taps, then repeat the pattern.", cat: "Focus Games" },
    { id: "numbers", path: "games/numbers/", name: "Number Slide", blurb: "Slide tiles to sort 1–15 on a 4×4 board.", cat: "Focus Games" },
    { id: "words", path: "games/words/", name: "Word Scramble", blurb: "Unscramble a common word, then try the next one.", cat: "Focus Games" },
    { id: "reaction", path: "games/reaction/", name: "Reaction Tap", blurb: "Wait for gold, then tap as fast as you can.", cat: "Focus Games" }
  ];

  function rootPrefix() {
    var body = document.body;
    if (body && body.getAttribute("data-root") !== null) {
      return body.getAttribute("data-root");
    }
    var path = (location.pathname || "").replace(/\\/g, "/");
    path = path.replace(/\/index\.html$/i, "/").replace(/\/+$/, "") || "/";
    if (path === "/" || path === "") return "";
    var parts = path.split("/").filter(Boolean);
    if (!parts.length) return "";
    return new Array(parts.length + 1).join("../");
  }

  function currentTool() {
    if (document.body && document.body.dataset.tool) return document.body.dataset.tool;
    var m = (location.pathname || "").match(/\/([a-z0-9-]+)\/?(?:index\.html)?$/i);
    return m ? m[1] : "home";
  }

  function iconSvg() {
    return '<svg class="brand-mark" viewBox="0 0 512 512" aria-hidden="true"><path fill="#FFC300" d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V288H216c-13.3 0-24 10.7-24 24s10.7 24 24 24H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z"/></svg>';
  }

  function buildNav(prefix, toolId) {
    var groups = CATS.map(function (cat) {
      var links = TOOLS.filter(function (t) { return t.cat === cat; }).map(function (t) {
        var cur = t.id === toolId ? ' aria-current="page"' : "";
        return '<a href="' + prefix + t.path + '"' + cur + ">" + t.name + "</a>";
      }).join("");
      return '<div class="nav-group"><h3>' + cat + "</h3>" + links + "</div>";
    }).join("");

    return (
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<header class="site-header">' +
        '<div class="site-header-inner">' +
          '<a class="brand" href="' + prefix + 'index.html">' + iconSvg() +
            '<span class=\"brand-name\">Ramkumar\'s <span>Toolkit</span></span></a>' +
          '<nav class="site-nav" aria-label="Primary">' +
            '<a class="nav-link" href="' + prefix + 'index.html">Home</a>' +
            '<details class="nav-menu">' +
              '<summary class="nav-btn">Tools</summary>' +
              '<div class="nav-panel">' + groups + "</div>" +
            "</details>" +
            '<a class="nav-link" href="' + prefix + 'profile.html">Profile</a>' +
          "</nav>" +
        "</div>" +
      "</header>"
    );
  }

  function year() {
    return String(new Date().getFullYear());
  }

  function injectChrome() {
    var prefix = rootPrefix();
    var toolId = currentTool();
    var header = document.createElement("div");
    header.innerHTML = buildNav(prefix, toolId);
    while (header.firstChild) {
      document.body.insertBefore(header.firstChild, document.body.firstChild);
    }
    if (!document.querySelector("main") && !document.getElementById("main")) {
      var first = document.querySelector(".wrap, .page-main, body > header + *");
      if (first) first.id = "main";
    } else {
      var main = document.querySelector("main") || document.getElementById("main");
      if (main && !main.id) main.id = "main";
    }
    if (!document.querySelector(".site-footer")) {
      var footer = document.createElement("footer");
      footer.className = "site-footer";
      footer.innerHTML = "&copy; " + year() + " // RMKR-DEV.GITHUB.IO";
      document.body.appendChild(footer);
    }
  }

  function bumpLocalStat() {
    try {
      var id = currentTool();
      var key = "rmkr-stat-" + id;
      var n = parseInt(localStorage.getItem(key) || "0", 10) || 0;
      localStorage.setItem(key, String(n + 1));
    } catch (e) { /* private mode */ }
  }

  function closeMenusOnClick() {
    document.addEventListener("click", function (e) {
      document.querySelectorAll(".nav-menu[open]").forEach(function (d) {
        if (!d.contains(e.target)) d.removeAttribute("open");
      });
    });
  }

  window.RMKR = {
    tools: TOOLS,
    cats: CATS,
    rootPrefix: rootPrefix,
    currentTool: currentTool,
    copy: function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return Promise.resolve();
    },
    download: function (filename, text, type) {
      var blob = new Blob([text], { type: type || "text/plain" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    },
    setStatus: function (el, msg, kind) {
      if (!el) return;
      el.textContent = msg || "";
      el.className = "status" + (kind ? " " + kind : "");
    },
    bytesToHex: function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    },
    utf8Bytes: function (str) {
      return new TextEncoder().encode(str);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectChrome();
      bumpLocalStat();
      closeMenusOnClick();
    });
  } else {
    injectChrome();
    bumpLocalStat();
    closeMenusOnClick();
  }
})();
