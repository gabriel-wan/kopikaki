"use client";

import { type FormEvent, useState } from "react";

import { createAccount, signIn } from "@/lib/firebase-client";
import { Brand } from "./brand";

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "Please try again.";
  if (message.includes("email-already-in-use")) return "That KopiKaki name is already taken.";
  if (message.includes("invalid-credential")) return "That KopiKaki name or password is not recognised.";
  if (message.includes("weak-password")) return "Please use a password with at least 6 characters.";
  return message;
}

export function AccountScreen() {
  const [mode, setMode] = useState<"sign-in" | "create">("create");
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "create") await createAccount(loginName, password);
      else await signIn(loginName, password);
    } catch (cause) {
      setError(friendlyAuthError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="screen account-screen">
      <Brand />
      <div className="account-copy">
        <p className="eyebrow">Your KopiKaki</p>
        <h1>{mode === "create" ? "Let’s get you started" : "Welcome back"}</h1>
        <p>{mode === "create" ? "Choose a simple KopiKaki name and password. You will not need an email address." : "Enter your KopiKaki name and password."}</p>
      </div>
      <form className="account-form" onSubmit={submit}>
        <label htmlFor="login-name">KopiKaki name</label>
        <input id="login-name" autoCapitalize="none" autoComplete="username" maxLength={24} minLength={3} onChange={(event) => setLoginName(event.target.value)} pattern="[A-Za-z0-9-]{3,24}" placeholder="e.g. david-tan" required value={loginName} />
        <small>Use 3–24 letters, numbers, or hyphens.</small>
        <label htmlFor="password">Password</label>
        <input id="password" autoComplete={mode === "create" ? "new-password" : "current-password"} minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "create" ? "Create my account" : "Sign in"}</button>
      </form>
      <button className="account-switch" disabled={busy} onClick={() => { setMode(mode === "create" ? "sign-in" : "create"); setError(""); }} type="button">
        {mode === "create" ? "Already have an account? Sign in" : "New to KopiKaki? Create an account"}
      </button>
    </main>
  );
}
