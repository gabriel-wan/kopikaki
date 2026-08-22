import assert from "node:assert/strict";

import { buildProductionSeedWrites } from "./production-seed";

const writes = buildProductionSeedWrites(new Set(["kakis/heng"]));

assert.equal(writes.length, 4, "an existing demo document must be skipped");
assert.ok(
  !writes.some((write) => write.update.name.endsWith("/kakis/heng")),
  "the existing document must not be included in the commit",
);

for (const write of writes) {
  assert.deepEqual(
    write.currentDocument,
    { exists: false },
    "every write must refuse to overwrite a document created concurrently",
  );
}

const susan = writes.find((write) => write.update.name.endsWith("/kakis/susan"));
assert.deepEqual(susan?.update.fields.activities, {
  arrayValue: { values: [{ stringValue: "pickleball" }, { stringValue: "walk" }] },
});

assert.deepEqual(buildProductionSeedWrites(new Set(["kakis/heng", "kakis/susan", "kakis/raymond", "groups/bishan-active-kakis", "activities/kim-keat-kopi"])), []);

console.log("production seed plan checks passed");
