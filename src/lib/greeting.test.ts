import assert from "node:assert/strict";

import { homeGreeting } from "./greeting";

assert.equal(homeGreeting("Uncle David"), "Hello, Uncle David!");
assert.equal(homeGreeting(""), "Hello!");
console.log("home greeting passed");
