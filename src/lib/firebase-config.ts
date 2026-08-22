export const firebaseProjectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "kopikaki-local";
export const firestoreEmulatorPort = Number(
  process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT ?? 8080,
);
export const authEmulatorPort = Number(
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT ?? 9099,
);
export const useFirebaseEmulators =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
  (process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== "false");
