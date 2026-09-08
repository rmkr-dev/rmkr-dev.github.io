(function () {
  var GUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  function isGuid(value) {
    return GUID_RE.test(String(value || "").trim());
  }
  function parseAzureResourceId(input) {
    var raw = String(input || "").trim();
    if (!raw) throw new Error("Paste an Azure resource ID");
    var path = raw;
    if ((path.charAt(0) === '"' && path.charAt(path.length - 1) === '"') ||
        (path.charAt(0) === "'" && path.charAt(path.length - 1) === "'")) {
      path = path.slice(1, -1).trim();
    }
    if (path.charAt(0) !== "/") throw new Error("Resource ID must start with /");
    var segments = path.split("/").filter(Boolean);
    if (!segments.length) throw new Error("Resource ID has no segments");
    var result = {
      input: raw,
      normalized: "/" + segments.join("/"),
      kind: "unknown",
      subscriptionId: null,
      resourceGroup: null,
      providers: [],
      resourceType: null,
      name: null,
      parent: null,
      segments: segments.slice()
    };
    var i = 0;
    function lower(s) { return String(s).toLowerCase(); }
    if (lower(segments[0]) === "subscriptions") {
      if (segments.length < 2) throw new Error("Missing subscription ID");
      result.subscriptionId = segments[1];
      if (!isGuid(result.subscriptionId)) throw new Error("Subscription ID should be a GUID");
      i = 2;
      result.kind = "subscription";
      if (i < segments.length && lower(segments[i]) === "resourcegroups") {
        if (i + 1 >= segments.length) throw new Error("Missing resource group name");
        result.resourceGroup = segments[i + 1];
        i += 2;
        result.kind = "resourceGroup";
      }
    } else if (lower(segments[0]) === "providers") {
      i = 0;
      result.kind = "providerScoped";
    } else {
      throw new Error("Expected /subscriptions/{id}/... or /providers/{namespace}/...");
    }
    if (i < segments.length) {
      if (lower(segments[i]) !== "providers") {
        throw new Error('Unexpected segment "' + segments[i] + '" (expected providers)');
      }
      if (i + 1 >= segments.length) throw new Error("Missing provider namespace");
      var namespace = segments[i + 1];
      i += 2;
      var typeParts = [];
      var nameParts = [];
      var expectingType = true;
      while (i < segments.length) {
        if (expectingType) typeParts.push(segments[i]);
        else nameParts.push(segments[i]);
        expectingType = !expectingType;
        i += 1;
      }
      if (!typeParts.length) throw new Error("Provider present but resource type is missing");
      if (typeParts.length !== nameParts.length) {
        throw new Error("Each resource type needs a matching name segment");
      }
      result.providers = [{ namespace: namespace, types: typeParts.slice(), names: nameParts.slice() }];
      result.resourceType = namespace + "/" + typeParts.join("/");
      result.name = nameParts[nameParts.length - 1];
      if (nameParts.length > 1) {
        result.parent = {
          resourceType: namespace + "/" + typeParts.slice(0, -1).join("/"),
          name: nameParts[nameParts.length - 2]
        };
      }
      result.kind = "resource";
    }
    return result;
  }
  function formatAzureIdSummary(info) {
    var lines = ["Normalized: " + info.normalized, "Kind: " + info.kind];
    if (info.subscriptionId) lines.push("Subscription: " + info.subscriptionId);
    if (info.resourceGroup) lines.push("Resource group: " + info.resourceGroup);
    if (info.resourceType) lines.push("Type: " + info.resourceType);
    if (info.name) lines.push("Name: " + info.name);
    if (info.parent) lines.push("Parent: " + info.parent.resourceType + " / " + info.parent.name);
    if (info.providers.length) {
      var p = info.providers[0];
      lines.push("Provider: " + p.namespace);
      for (var i = 0; i < p.types.length; i++) {
        lines.push("  " + p.types[i] + " = " + p.names[i]);
      }
    }
    return lines.join("\n");
  }
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function card(title, value) {
    return '<div class="tool-card" style="cursor:default;"><h3>' + esc(title) +
      '</h3><p style="font-family:ui-monospace,monospace;word-break:break-all;">' +
      esc(value) + "</p></div>";
  }
  function ready() {
    var input = document.getElementById("idInput");
    var output = document.getElementById("output");
    var status = document.getElementById("status");
    var cards = document.getElementById("cards");
    function render(info) {
      output.value = formatAzureIdSummary(info);
      var bits = [];
      if (info.subscriptionId) bits.push(card("Subscription", info.subscriptionId));
      if (info.resourceGroup) bits.push(card("Resource group", info.resourceGroup));
      if (info.resourceType) bits.push(card("Type", info.resourceType));
      if (info.name) bits.push(card("Name", info.name));
      if (info.parent) bits.push(card("Parent", info.parent.resourceType + " / " + info.parent.name));
      bits.push(card("Kind", info.kind));
      cards.innerHTML = bits.join("");
      RMKR.setStatus(status, "Parsed " + info.kind + ".", "ok");
    }
    function run() {
      try { render(parseAzureResourceId(input.value)); }
      catch (e) {
        cards.innerHTML = "";
        output.value = "";
        RMKR.setStatus(status, e.message || String(e), "err");
      }
    }
    document.getElementById("run").onclick = run;
    document.getElementById("clear").onclick = function () {
      input.value = "";
      output.value = "";
      cards.innerHTML = "";
      RMKR.setStatus(status, "", "");
      input.focus();
    };
    document.getElementById("copyOut").onclick = function () {
      var v = output.value;
      if (!v) return RMKR.setStatus(status, "Parse first.", "err");
      RMKR.copy(v).then(function () { RMKR.setStatus(status, "Copied.", "ok"); });
    };
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") run(); });
    run();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
