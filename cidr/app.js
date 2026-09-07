(function () {
  function ipv4ToInt(ip) {
    var parts = String(ip).trim().split(".");
    if (parts.length !== 4) throw new Error("IPv4 address must have 4 octets");
    var n = 0;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!/^\d+$/.test(p)) throw new Error("Invalid IPv4 octet");
      var v = Number(p);
      if (v < 0 || v > 255) throw new Error("IPv4 octet out of range");
      n = (n << 8) + v;
    }
    return n >>> 0;
  }
  function intToIpv4(n) {
    var x = n >>> 0;
    return [(x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255].join(".");
  }
  function prefixToMask(prefix) {
    var p = Number(prefix);
    if (!Number.isInteger(p) || p < 0 || p > 32) throw new Error("Prefix must be an integer from 0 to 32");
    if (p === 0) return 0;
    return (0xffffffff << (32 - p)) >>> 0;
  }
  function parseCidr(input) {
    var raw = String(input || "").trim();
    if (!raw) throw new Error("Enter an IPv4 address or CIDR");
    if (raw.indexOf(":") >= 0) throw new Error("IPv6 is not supported yet");
    var ipPart = raw;
    var prefix = 32;
    if (raw.indexOf("/") >= 0) {
      var bits = raw.split("/");
      if (bits.length !== 2) throw new Error("Use address/prefix, e.g. 10.0.0.0/24");
      ipPart = bits[0].trim();
      prefix = Number(bits[1].trim());
      if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error("Prefix must be an integer from 0 to 32");
    }
    var ip = ipv4ToInt(ipPart);
    var mask = prefixToMask(prefix);
    var network = (ip & mask) >>> 0;
    var broadcast = (network | (~mask >>> 0)) >>> 0;
    var hostBits = 32 - prefix;
    var size = hostBits === 32 ? Math.pow(2, 32) : Math.pow(2, hostBits);
    var firstHost, lastHost, hostCount;
    if (prefix >= 31) {
      firstHost = network;
      lastHost = broadcast;
      hostCount = prefix === 31 ? 2 : 1;
    } else {
      firstHost = network + 1;
      lastHost = broadcast - 1;
      hostCount = size - 2;
    }
    return {
      input: raw,
      ip: intToIpv4(ip),
      prefix: prefix,
      netmask: intToIpv4(mask),
      wildcard: intToIpv4((~mask) >>> 0),
      network: intToIpv4(network),
      broadcast: intToIpv4(broadcast),
      firstHost: intToIpv4(firstHost),
      lastHost: intToIpv4(lastHost),
      hostCount: hostCount,
      addressCount: size,
      isNetworkAligned: ip === network
    };
  }
  function formatCidrSummary(info) {
    var lines = [
      "CIDR: " + info.network + "/" + info.prefix,
      "Address: " + info.ip,
      "Netmask: " + info.netmask,
      "Wildcard: " + info.wildcard,
      "Network: " + info.network,
      "Broadcast: " + info.broadcast,
      "Host range: " + info.firstHost + " - " + info.lastHost,
      "Usable hosts: " + info.hostCount,
      "Addresses in block: " + info.addressCount
    ];
    if (!info.isNetworkAligned) lines.push("Note: input IP is a host inside " + info.network + "/" + info.prefix);
    return lines.join("\n");
  }
  function card(title, value) {
    return '<div class="tool-card" style="cursor:default;"><h3>' + title + '</h3><p style="font-family:ui-monospace,monospace;word-break:break-all;">' + value + '</p></div>';
  }
  function ready() {
    var input = document.getElementById("cidrInput");
    var output = document.getElementById("output");
    var status = document.getElementById("status");
    var cards = document.getElementById("cards");
    function render(info) {
      output.value = formatCidrSummary(info);
      cards.innerHTML = [
        card("Network", info.network + "/" + info.prefix),
        card("Netmask", info.netmask),
        card("Wildcard", info.wildcard),
        card("Broadcast", info.broadcast),
        card("Host range", info.firstHost + " - " + info.lastHost),
        card("Usable hosts", String(info.hostCount))
      ].join("");
      RMKR.setStatus(status, info.isNetworkAligned ? "Aligned network address." : "Input is a host inside this block.", "ok");
    }
    function calculate() {
      try { render(parseCidr(input.value)); }
      catch (e) {
        cards.innerHTML = "";
        output.value = "";
        RMKR.setStatus(status, e.message || String(e), "err");
      }
    }
    document.getElementById("run").onclick = calculate;
    document.getElementById("clear").onclick = function () {
      input.value = "";
      output.value = "";
      cards.innerHTML = "";
      RMKR.setStatus(status, "", "");
      input.focus();
    };
    document.getElementById("copyOut").onclick = function () {
      var v = output.value;
      if (!v) return RMKR.setStatus(status, "Calculate first.", "err");
      RMKR.copy(v).then(function () { RMKR.setStatus(status, "Copied.", "ok"); });
    };
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") calculate(); });
    calculate();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
