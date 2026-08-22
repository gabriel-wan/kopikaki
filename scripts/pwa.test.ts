import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const serviceWorker = readFileSync("public/sw.js", "utf8");
const heroApp = readFileSync("src/components/hero-app.tsx", "utf8");
const nextConfig = readFileSync("next.config.ts", "utf8");

assert.doesNotThrow(() => new Function(serviceWorker), "The service worker must be valid JavaScript.");
assert.doesNotMatch(
  serviceWorker,
  /addAll\(\s*\[\s*["']\/["']/,
  "The service worker must not cache Next.js HTML with short-lived chunk URLs.",
);
assert.match(serviceWorker, /skipWaiting\(\)/, "A fixed worker must activate immediately.");
assert.match(serviceWorker, /clients\.claim\(\)/, "A fixed worker must take control immediately.");
assert.match(serviceWorker, /caches\.delete/, "Old KopiKaki caches must be removed.");
assert.match(
  heroApp,
  /process\.env\.NODE_ENV\s*===\s*["']production["']/,
  "The service worker must only register in production.",
);
assert.match(heroApp, /getRegistrations\(\)/, "Development must unregister stale workers.");
assert.match(nextConfig, /allowedDevOrigins/, "Mobile LAN origins must be allowed in development.");

console.log("PWA cache and LAN safeguards: ok");
