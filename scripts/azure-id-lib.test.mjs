import assert from "node:assert/strict";
import {
  isGuid,
  parseAzureResourceId,
  formatAzureIdSummary,
} from "./azure-id-lib.mjs";

export function runAzureIdTests() {
  assert.equal(isGuid("00000000-0000-0000-0000-000000000000"), true);
  assert.equal(isGuid("not-a-guid"), false);

  const sub = parseAzureResourceId(
    "/subscriptions/11111111-1111-1111-1111-111111111111"
  );
  assert.equal(sub.kind, "subscription");
  assert.equal(sub.subscriptionId, "11111111-1111-1111-1111-111111111111");
  assert.equal(sub.resourceGroup, null);

  const rg = parseAzureResourceId(
    "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/demo-rg"
  );
  assert.equal(rg.kind, "resourceGroup");
  assert.equal(rg.resourceGroup, "demo-rg");

  const vm = parseAzureResourceId(
    "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/demo-rg/providers/Microsoft.Compute/virtualMachines/web-01"
  );
  assert.equal(vm.kind, "resource");
  assert.equal(vm.resourceType, "Microsoft.Compute/virtualMachines");
  assert.equal(vm.name, "web-01");
  assert.equal(vm.parent, null);

  const nested = parseAzureResourceId(
    "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/demo-rg/providers/Microsoft.Compute/virtualMachines/web-01/extensions/CustomScript"
  );
  assert.equal(
    nested.resourceType,
    "Microsoft.Compute/virtualMachines/extensions"
  );
  assert.equal(nested.name, "CustomScript");
  assert.equal(nested.parent.resourceType, "Microsoft.Compute/virtualMachines");
  assert.equal(nested.parent.name, "web-01");

  const quoted = parseAzureResourceId(
    '"/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg1"'
  );
  assert.equal(quoted.resourceGroup, "rg1");

  const summary = formatAzureIdSummary(vm);
  assert.match(summary, /Microsoft\.Compute\/virtualMachines/);
  assert.match(summary, /web-01/);

  assert.throws(() => parseAzureResourceId(""), /Paste/);
  assert.throws(() => parseAzureResourceId("subscriptions/x"), /must start/);
  assert.throws(
    () => parseAzureResourceId("/subscriptions/not-a-guid"),
    /GUID/
  );
  assert.throws(
    () =>
      parseAzureResourceId(
        "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines"
      ),
    /matching name/
  );
}

const isDirect =
  process.argv[1] && process.argv[1].endsWith("azure-id-lib.test.mjs");
if (isDirect) {
  runAzureIdTests();
  console.log("azure-id-lib.test: OK");
}
