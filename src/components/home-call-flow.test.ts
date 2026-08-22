import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BottomNav } from "./bottom-nav";
import { CallScreen } from "./call-screen";

const navigation = renderToStaticMarkup(
  createElement(BottomNav, { active: "home", onChange: () => undefined }),
);

assert.match(navigation, />Home</, "Home must remain in the primary navigation.");
assert.match(navigation, />Schedule</, "Schedule must remain in the primary navigation.");
assert.match(navigation, />Kakis</, "Kakis must remain in the primary navigation.");
assert.doesNotMatch(
  navigation,
  />Call</,
  "The call experience must open from Home, not from a dedicated navigation item.",
);

const callExperience = renderToStaticMarkup(
  createElement(CallScreen, {
    onBack: () => undefined,
    onTranscript: async () => undefined,
    onVoiceConfirmed: () => undefined,
  }),
);

assert.match(
  callExperience,
  /What do you feel like doing\?/,
  "The call experience must open with the activity prompt.",
);
assert.doesNotMatch(
  callExperience,
  /Calling KopiKaki/i,
  "The call experience must not repeat the KopiKaki label above the prompt.",
);
assert.doesNotMatch(
  callExperience,
  /alt="KopiKaki"/,
  "The call experience must not show the KopiKaki logo in its header.",
);

console.log("Home-to-call presentation: ok");
