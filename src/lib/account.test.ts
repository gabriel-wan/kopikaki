import assert from "node:assert/strict";

import { loginNameToEmail } from "./account";

assert.equal(loginNameToEmail("David-Tan"), "david-tan@users.kopikaki.invalid");
assert.throws(() => loginNameToEmail("Uncle David"), /Use 3–24 letters, numbers, or hyphens/);
console.log("account helpers passed");
