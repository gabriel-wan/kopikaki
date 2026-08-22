"use client";

import { GoogleGenAI, Modality, type Session } from "@google/genai";
import { ArrowLeft, Mic, Search, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiPost } from "@/lib/firebase-client";
import { createAudioPlayer, streamMicrophone } from "@/lib/live-audio";
import { Brand } from "./brand";

type CallStatus = "ready" | "connecting" | "listening" | "thinking";

export function CallScreen({
  onBack,
  onTranscript,
}: {
  onBack: () => void;
  onTranscript: (transcript: string) => Promise<void>;
}) {
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<CallStatus>("ready");
  const [error, setError] = useState("");
  const mountedRef = useRef(true);
  const sessionRef = useRef<Session | null>(null);
  const stopMicRef = useRef<null | (() => Promise<void>)>(null);
  const closePlayerRef = useRef<null | (() => Promise<void>)>(null);

  const stopVoice = useCallback(async (resetStatus = true) => {
    const stopMic = stopMicRef.current;
    const session = sessionRef.current;
    const closePlayer = closePlayerRef.current;
    stopMicRef.current = null;
    sessionRef.current = null;
    closePlayerRef.current = null;

    const cleanup: Promise<unknown>[] = [];
    if (stopMic) cleanup.push(stopMic());
    if (session) {
      try {
        session.close();
      } catch {
        // Continue releasing the remaining browser audio resources.
      }
    }
    if (closePlayer) cleanup.push(closePlayer());
    await Promise.allSettled(cleanup);
    if (resetStatus && mountedRef.current) setStatus("ready");
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void stopVoice(false);
    };
  }, [stopVoice]);

  async function startVoice() {
    await stopVoice(false);
    setError("");
    setStatus("connecting");
    try {
      const { token, model } = await apiPost<{ token: string; model: string }>("/api/live-token");
      const player = createAudioPlayer();
      closePlayerRef.current = player.close;
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: "v1alpha" },
      });
      let liveSession: Session | null = null;
      const session = await ai.live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction:
            "You are KopiKaki, a warm concise Singapore social concierge for seniors. Ask what the caller feels like doing, when, and where. Understand Singlish and English, Mandarin, Malay, Tamil, or Hokkien. Keep replies short and guide them toward a real meetup.",
        },
        callbacks: {
          onmessage(message) {
            const input = message.serverContent?.inputTranscription?.text;
            if (input && mountedRef.current) {
              setTranscript((current) => (current + " " + input).trim());
            }
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) player.play(part.inlineData.data);
            }
          },
          onerror: () => {
            if (mountedRef.current) {
              setError("The voice call was interrupted. You can type your request below.");
            }
          },
          onclose: () => {
            if (mountedRef.current && sessionRef.current === liveSession) {
              setStatus("ready");
            }
          },
        },
      });
      liveSession = session;
      sessionRef.current = session;
      const stopMic = await streamMicrophone(session);
      if (!mountedRef.current || sessionRef.current !== session) {
        await stopMic();
        return;
      }
      stopMicRef.current = stopMic;
      setStatus("listening");
    } catch (cause) {
      await stopVoice(false);
      if (mountedRef.current) {
        setStatus("ready");
        setError(cause instanceof Error ? cause.message : "Voice could not start. Please type instead.");
      }
    }
  }

  async function findMatch() {
    if (transcript.trim().length < 3) {
      setError("Tell me what you feel like doing first.");
      return;
    }
    setError("");
    setStatus("thinking");
    try {
      await stopVoice(false);
      await onTranscript(transcript);
    } catch (cause) {
      setStatus("ready");
      setError(cause instanceof Error ? cause.message : "I could not understand that. Please try again.");
    }
  }

  const heading =
    status === "listening"
      ? "I’m listening…"
      : status === "connecting"
        ? "Starting the call…"
        : status === "thinking"
          ? "Finding a kaki…"
          : "What do you feel like doing?";

  return (
    <main className="screen call-screen">
      <header className="topbar call-topbar">
        <button className="icon-button" onClick={onBack} aria-label="Go back">
          <ArrowLeft />
        </button>
        <Brand compact />
        <span className="icon-spacer" />
      </header>
      <section className="call-center">
        <p className="eyebrow">Calling KopiKaki</p>
        <h1>{heading}</h1>
        <div className={status === "listening" ? "voice-orb listening" : "voice-orb"} aria-hidden="true">
          <Brand compact />
        </div>
        <button
          className={status === "listening" ? "voice-button stop" : "voice-button"}
          onClick={status === "listening" ? () => void stopVoice() : startVoice}
          disabled={status === "connecting" || status === "thinking"}
        >
          {status === "listening" ? <Square fill="currentColor" aria-hidden="true" /> : <Mic fill="currentColor" aria-hidden="true" />}
          {status === "listening" ? "Stop listening" : "Tap to speak"}
        </button>
      </section>
      <div className="text-fallback">
        <label htmlFor="request">Or type what you want</label>
        <textarea
          id="request"
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="Tomorrow morning I want to play pickleball near Bishan."
          rows={3}
        />
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button" onClick={findMatch} disabled={status === "thinking"}>
          <Search size={23} aria-hidden="true" />
          {status === "thinking" ? "Finding someone…" : "Find my kaki"}
        </button>
      </div>
    </main>
  );
}
