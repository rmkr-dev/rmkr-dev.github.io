import assert from "node:assert/strict";
import {
  ipv4ToInt,
  intToIpv4,
  parseCidr,
  formatCidrSummary,
  prefixToMask,
} from "./cidr-lib.mjs";

export function runCidrTests() {
  assert.equal(intToIpv4(ipv4ToInt("10.0.0.1")), "10.0.0.1");
  assert.equal(intToIpv4(prefixToMask(24)), "255.255.255.0");
  assert.equal(intToIpv4(prefixToMask(0)), "0.0.0.0");
  assert.equal(intToIpv4(prefixToMask(32)), "255.255.255.255");

  const c24 = parseCidr("10.0.0.0/24");
  assert.equal(c24.network, "10.0.0.0");
  assert.equal(c24.broadcast, "10.0.0.255");
  assert.equal(c24.netmask, "255.255.255.0");
  assert.equal(c24.wildcard, "0.0.0.255");
  assert.equal(c24.firstHost, "10.0.0.1");
  assert.equal(c24.lastHost, "10.0.0.254");
  assert.equal(c24.hostCount, 254);
  assert.equal(c24.addressCount, 256);
  assert.equal(c24.isNetworkAligned, true);

  const host = parseCidr("192.168.1.10/28");
  assert.equal(host.network, "192.168.1.0");
  assert.equal(host.broadcast, "192.168.1.15");
  assert.equal(host.firstHost, "192.168.1.1");
  assert.equal(host.lastHost, "192.168.1.14");
  assert.equal(host.hostCount, 14);
  assert.equal(host.isNetworkAligned, false);

  const single = parseCidr("8.8.8.8");
  assert.equal(single.prefix, 32);
  assert.equal(single.network, "8.8.8.8");
  assert.equal(single.broadcast, "8.8.8.8");
  assert.equal(single.hostCount, 1);

  const p31 = parseCidr("10.0.0.0/31");
  assert.equal(p31.hostCount, 2);
  assert.equal(p31.firstHost, "10.0.0.0");
  assert.equal(p31.lastHost, "10.0.0.1");

  const summary = formatCidrSummary(c24);
  assert.match(summary, /10\.0\.0\.0\/24/);
  assert.match(summary, /Usable hosts: 254/);

  assert.throws(() => parseCidr(""), /Enter an IPv4/);
  assert.throws(() => parseCidr("2001:db8::/32"), /IPv6/);
  assert.throws(() => parseCidr("10.0.0.0/33"), /Prefix/);
  assert.throws(() => parseCidr("10.0.0.256/24"), /octet/);
  assert.throws(() => ipv4ToInt("1.2.3"), /4 octets/);
}

const isDirect = process.argv[1] && process.argv[1].endsWith("cidr-lib.test.mjs");
if (isDirect) {
  runCidrTests();
  console.log("cidr-lib.test: OK");
}
