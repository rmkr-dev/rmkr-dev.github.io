/**
 * Azure Resource ID helpers for the toolkit parser.
 * Pure functions — safe from Node tests and the browser.
 */

const GUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isGuid(value) {
  return GUID_RE.test(String(value || "").trim());
}

/**
 * Parse a full or partial Azure resource ID into structured parts.
 * Accepts subscription, resource group, provider, and nested type segments.
 */
export function parseAzureResourceId(input) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("Paste an Azure resource ID");

  let path = raw;
  // Allow accidental wrapping quotes or ARM ID prefix noise
  if (
    (path.startsWith('"') && path.endsWith('"')) ||
    (path.startsWith("'") && path.endsWith("'"))
  ) {
    path = path.slice(1, -1).trim();
  }
  if (!path.startsWith("/")) {
    throw new Error("Resource ID must start with /");
  }

  const segments = path.split("/").filter(Boolean);
  if (!segments.length) throw new Error("Resource ID has no segments");

  const result = {
    input: raw,
    normalized: "/" + segments.join("/"),
    kind: "unknown",
    subscriptionId: null,
    resourceGroup: null,
    providers: [],
    resourceType: null,
    name: null,
    parent: null,
    segments: segments.slice(),
  };

  let i = 0;
  const lower = (s) => String(s).toLowerCase();

  if (lower(segments[0]) === "subscriptions") {
    if (segments.length < 2) throw new Error("Missing subscription ID");
    result.subscriptionId = segments[1];
    if (!isGuid(result.subscriptionId)) {
      throw new Error("Subscription ID should be a GUID");
    }
    i = 2;
    result.kind = "subscription";

    if (i < segments.length && lower(segments[i]) === "resourcegroups") {
      if (i + 1 >= segments.length) throw new Error("Missing resource group name");
      result.resourceGroup = segments[i + 1];
      i += 2;
      result.kind = "resourceGroup";
    }
  } else if (lower(segments[0]) === "providers") {
    // Tenant- or management-group scoped
    i = 0;
    result.kind = "providerScoped";
  } else {
    throw new Error(
      "Expected /subscriptions/{id}/... or /providers/{namespace}/..."
    );
  }

  if (i < segments.length) {
    if (lower(segments[i]) !== "providers") {
      throw new Error(`Unexpected segment "${segments[i]}" (expected providers)`);
    }
    if (i + 1 >= segments.length) throw new Error("Missing provider namespace");

    const namespace = segments[i + 1];
    i += 2;

    const typeParts = [];
    const nameParts = [];
    let expectingType = true;
    while (i < segments.length) {
      if (expectingType) {
        typeParts.push(segments[i]);
        expectingType = false;
      } else {
        nameParts.push(segments[i]);
        expectingType = true;
      }
      i += 1;
    }
    if (!typeParts.length) {
      throw new Error("Provider present but resource type is missing");
    }
    if (typeParts.length !== nameParts.length) {
      throw new Error("Each resource type needs a matching name segment");
    }

    result.providers = [
      {
        namespace,
        types: typeParts.slice(),
        names: nameParts.slice(),
      },
    ];
    result.resourceType = namespace + "/" + typeParts.join("/");
    result.name = nameParts[nameParts.length - 1];
    if (nameParts.length > 1) {
      result.parent = {
        resourceType: namespace + "/" + typeParts.slice(0, -1).join("/"),
        name: nameParts[nameParts.length - 2],
      };
    }
    result.kind = "resource";
  }

  return result;
}

export function formatAzureIdSummary(info) {
  const lines = [
    `Normalized: ${info.normalized}`,
    `Kind: ${info.kind}`,
  ];
  if (info.subscriptionId) lines.push(`Subscription: ${info.subscriptionId}`);
  if (info.resourceGroup) lines.push(`Resource group: ${info.resourceGroup}`);
  if (info.resourceType) lines.push(`Type: ${info.resourceType}`);
  if (info.name) lines.push(`Name: ${info.name}`);
  if (info.parent) {
    lines.push(
      `Parent: ${info.parent.resourceType} / ${info.parent.name}`
    );
  }
  if (info.providers.length) {
    const p = info.providers[0];
    lines.push(`Provider: ${p.namespace}`);
    for (let i = 0; i < p.types.length; i++) {
      lines.push(`  ${p.types[i]} = ${p.names[i]}`);
    }
  }
  return lines.join("\n");
}
