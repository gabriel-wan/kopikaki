import assert from "node:assert/strict";

import { profileFieldsFromAuthDisplayName } from "./profile-recovery";

assert.deepEqual(profileFieldsFromAuthDisplayName("  david-tan  "), {
  name: "david-tan",
  preferredName: "david-tan",
});
assert.equal(profileFieldsFromAuthDisplayName(undefined), null);
assert.equal(profileFieldsFromAuthDisplayName("   "), null);

console.log("profile recovery checks passed");
