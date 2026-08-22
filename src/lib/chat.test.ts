import assert from "node:assert/strict";

import { chatId, parseChatText } from "./chat";

assert.equal(chatId("user-b", "user-a"), chatId("user-a", "user-b"));
assert.equal(chatId("user-a", "user-b"), "user-a_user-b");

assert.equal(parseChatText("  Hello there  "), "Hello there");
assert.throws(() => parseChatText(""), /empty/i);
assert.throws(() => parseChatText("x".repeat(501)), /long/i);

console.log("chat helpers passed");
