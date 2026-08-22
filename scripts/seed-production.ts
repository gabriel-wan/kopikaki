import { createRequire } from "node:module";

import {
  buildProductionSeedWrites,
  productionFirestoreProject,
  productionSeedPaths,
} from "../src/lib/production-seed";

const require = createRequire(import.meta.url);

type FirebaseCliOptions = {
  project: string;
  projectId: string;
  user: unknown;
  tokens: { refresh_token?: string } | undefined;
  authScopes?: string[];
};

type FirebaseCliAuth = {
  requireAuth(options: FirebaseCliOptions): Promise<unknown>;
};

type FirebaseCliToken = {
  getAccessToken(refreshToken: string | undefined, scopes: string[] | undefined): Promise<{ access_token: string }>;
};

const { configstore } = require("firebase-tools/lib/configstore") as {
  configstore: { get(key: string): unknown };
};
const { requireAuth } = require("firebase-tools/lib/requireAuth") as FirebaseCliAuth;
const { getAccessToken } = require("firebase-tools/lib/auth") as FirebaseCliToken;

const databaseRoot = `https://firestore.googleapis.com/v1/projects/${productionFirestoreProject}/databases/(default)/documents`;

async function productionAccessToken(): Promise<string> {
  const options: FirebaseCliOptions = {
    project: productionFirestoreProject,
    projectId: productionFirestoreProject,
    user: configstore.get("user"),
    tokens: configstore.get("tokens") as FirebaseCliOptions["tokens"],
  };
  await requireAuth(options);
  const token = await getAccessToken(options.tokens?.refresh_token, options.authScopes);
  return token.access_token;
}

async function existingPaths(accessToken: string): Promise<Set<string>> {
  const results = await Promise.all(
    productionSeedPaths.map(async (path) => {
      const response = await fetch(`${databaseRoot}/${path}`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) return path;
      if (response.status === 404) return null;
      throw new Error(`Could not check ${path}: ${response.status} ${await response.text()}`);
    }),
  );
  return new Set(results.filter((path): path is string => path !== null));
}

async function seed() {
  const accessToken = await productionAccessToken();
  const existing = await existingPaths(accessToken);
  const writes = buildProductionSeedWrites(existing);

  if (writes.length === 0) {
    console.log("All production demo candidates already exist; nothing changed.");
    return;
  }

  const response = await fetch(`${databaseRoot}:commit`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ writes }),
  });
  if (!response.ok) throw new Error(`Production seed failed: ${response.status} ${await response.text()}`);

  console.log(`Created ${writes.length} production demo candidate${writes.length === 1 ? "" : "s"}. Existing documents were left unchanged.`);
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
