type FirestoreValue =
  | { stringValue: string }
  | { arrayValue: { values: { stringValue: string }[] } };

export type FirestoreWrite = {
  update: {
    name: string;
    fields: Record<string, FirestoreValue>;
  };
  currentDocument: { exists: false };
};

type DemoDocument = {
  path: string;
  fields: Record<string, string | string[]>;
};

export const productionFirestoreProject = "kopikakis-cc6d5";

const demoDocuments: DemoDocument[] = [
  {
    path: "kakis/heng",
    fields: {
      kind: "person",
      name: "Uncle Heng",
      activities: ["pickleball", "kopi", "chess"],
      times: ["morning"],
      neighborhood: "Bishan",
      languages: ["English", "Mandarin"],
      venue: "Bishan Sports Hall",
    },
  },
  {
    path: "kakis/susan",
    fields: {
      kind: "person",
      name: "Auntie Susan",
      activities: ["pickleball", "walk"],
      times: ["morning", "afternoon"],
      neighborhood: "Bishan",
      languages: ["English", "Mandarin"],
      venue: "Bishan Sports Hall",
    },
  },
  {
    path: "kakis/raymond",
    fields: {
      kind: "person",
      name: "Uncle Raymond",
      activities: ["chess", "kopi"],
      times: ["afternoon"],
      neighborhood: "Toa Payoh",
      languages: ["English", "Hokkien"],
      venue: "Toa Payoh Central",
    },
  },
  {
    path: "groups/bishan-active-kakis",
    fields: {
      kind: "group",
      name: "Bishan Active Kakis",
      members: ["Uncle Heng", "Auntie Susan"],
      activities: ["walk", "pickleball"],
      times: ["morning"],
      neighborhood: "Bishan",
      languages: ["English", "Mandarin"],
      venue: "Bishan Community Club",
    },
  },
  {
    path: "activities/kim-keat-kopi",
    fields: {
      kind: "activity",
      name: "Kim Keat Kopi Chat",
      members: ["Community host"],
      activities: ["kopi"],
      times: ["morning"],
      neighborhood: "Kim Keat",
      languages: ["English", "Mandarin", "Hokkien"],
      venue: "Kim Keat Café",
    },
  },
];

export const productionSeedPaths = demoDocuments.map((document) => document.path);

function toFirestoreValue(value: string | string[]): FirestoreValue {
  return Array.isArray(value)
    ? { arrayValue: { values: value.map((item) => ({ stringValue: item })) } }
    : { stringValue: value };
}

export function buildProductionSeedWrites(existingPaths: ReadonlySet<string>): FirestoreWrite[] {
  return demoDocuments
    .filter((document) => !existingPaths.has(document.path))
    .map((document) => ({
      update: {
        name: `projects/${productionFirestoreProject}/databases/(default)/documents/${document.path}`,
        fields: Object.fromEntries(
          Object.entries(document.fields).map(([field, value]) => [field, toFirestoreValue(value)]),
        ),
      },
      currentDocument: { exists: false },
    }));
}
