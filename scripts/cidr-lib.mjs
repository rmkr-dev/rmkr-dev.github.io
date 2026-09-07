/**
 * IPv4 CIDR helpers for the toolkit CIDR calculator.
 * Pure functions — safe to use from Node tests and the browser.
 */

export function ipv4ToInt(ip) {
  const parts = String(ip).trim().split(".");
  if (parts.length !== 4) throw new Error("IPv4 address must have 4 octets");
  let n = 0;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) throw new Error("Invalid IPv4 octet");
    const v = Number(p);
    if (v < 0 || v > 255) throw new Error("IPv4 octet out of range");
    n = (n << 8) + v;
  }
  return n >>> 0;
}

export function intToIpv4(n) {
  const x = n >>> 0;
  return [
    (x >>> 24) & 255,
    (x >>> 16) & 255,
    (x >>> 8) & 255,
    x & 255,
  ].join(".");
}

export function prefixToMask(prefix) {
  const p = Number(prefix);
  if (!Number.isInteger(p) || p < 0 || p > 32) {
    throw new Error("Prefix must be an integer from 0 to 32");
  }
  if (p === 0) return 0;
  return (0xffffffff << (32 - p)) >>> 0;
}

export function parseCidr(input) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("Enter an IPv4 address or CIDR");
  if (raw.includes(":")) throw new Error("IPv6 is not supported yet");

  let ipPart = raw;
  let prefix = 32;
  if (raw.includes("/")) {
    const bits = raw.split("/");
    if (bits.length !== 2) throw new Error("Use address/prefix, e.g. 10.0.0.0/24");
    ipPart = bits[0].trim();
    prefix = Number(bits[1].trim());
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      throw new Error("Prefix must be an integer from 0 to 32");
    }
  }

  const ip = ipv4ToInt(ipPart);
  const mask = prefixToMask(prefix);
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const hostBits = 32 - prefix;
  const size = hostBits === 32 ? 2 ** 32 : 2 ** hostBits;
  const usable =
    prefix >= 31
      ? prefix === 31
        ? [network, broadcast]
        : [network]
      : [network + 1, broadcast - 1];

  return {
    input: raw,
    ip: intToIpv4(ip),
    prefix,
    netmask: intToIpv4(mask),
    wildcard: intToIpv4((~mask) >>> 0),
    network: intToIpv4(network),
    broadcast: intToIpv4(broadcast),
    firstHost: intToIpv4(usable[0]),
    lastHost: intToIpv4(usable[usable.length - 1]),
    hostCount: prefix >= 31 ? usable.length : size - 2,
    addressCount: size,
    isNetworkAligned: ip === network,
  };
}

export function formatCidrSummary(info) {
  const lines = [
    `CIDR: ${info.network}/${info.prefix}`,
    `Address: ${info.ip}`,
    `Netmask: ${info.netmask}`,
    `Wildcard: ${info.wildcard}`,
    `Network: ${info.network}`,
    `Broadcast: ${info.broadcast}`,
    `Host range: ${info.firstHost} – ${info.lastHost}`,
    `Usable hosts: ${info.hostCount}`,
    `Addresses in block: ${info.addressCount}`,
  ];
  if (!info.isNetworkAligned) {
    lines.push(`Note: input IP is a host inside ${info.network}/${info.prefix}`);
  }
  return lines.join("\n");
}
