"use client";

import { GoogleGenAI, Modality, type Session } from "@google/genai";
import { ArrowLeft, Mic, Search, Square } from "lucide-react";
import { useRef, useState } from "react";
import { apiPost } from "@/lib/firebase-client";
import { createAudioPlayer, streamMicrophone } from "@/lib/live-audio";
import { Brand } from "./brand";

export function CallScreen({ onBack, onTranscript }: { onBack: () => void; onTranscript: (transcript: string) => Promise<void> }) {
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"ready" | "connecting" | "listening" | "thinking">("ready");
  const [error, setError] = useState("");
  const sessionRef = useRef<Session | null>(null);
  const stopMicRef = useRef<null | (() => Promise<void>)>(null);
  const closePlayerRef = useRef<null | (() => Promise<void>)>(null);

  async function startVoice() {
    setError(""); setStatus("connecting");
    try {
      const { token, model } = await apiPost<{ token: string; model: string }>("/api/live-token");
      const player = createAudioPlayer(); closePlayerRef.current = player.close;
      const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });
      const session = await ai.live.connect({ model, config: { responseModalities: [Modality.AUDIO], inputAudioTranscription: {}, outputAudioTranscription: {}, systemInstruction: "You are KopiKaki, a warm concise Singapore social concierge for seniors. Ask what the caller feels like doing, when, and where. Understand Singlish and English, Mandarin, Malay, Tamil, or Hokkien. Keep replies short and guide them toward a real meetup." }, callbacks: { onmessage(message) { const input = message.serverContent?.inputTranscription?.text; if (input) setTranscript((current) => `${current} ${input}`.trim()); for (const part of message.serverContent?.modelTurn?.parts ?? []) if (part.inlineData?.data) player.play(part.inlineData.data); }, onerror: () => setError("The voice call was interrupted. You can type your request below."), onclose: () => setStatus("ready") } });
      sessionRef.current = session; stopMicRef.current = await streamMicrophone(session); setStatus("listening");
    } catch (cause) { setStatus("ready"); setError(cause instanceof Error ? cause.message : "Voice could not start. Please type instead."); }
  }

  async function stopVoice() {
    await stopMicRef.current?.(); sessionRef.current?.close(); await closePlayerRef.current?.(); stopMicRef.current = null; sessionRef.current = null; setStatus("ready");
  }

  async function findMatch() {
    if (transcript.trim().length < 3) return setError("Tell me what you feel like doing first.");
    setError(""); setStatus("thinking");
    try { await stopVoice(); await onTranscript(transcript); }
    catch (cause) { setStatus("ready"); setError(cause instanceof Error ? cause.message : "I could not understand that. Please try again."); }
  }

  return <main className="screen call-screen"><header className="topbar call-topbar"><button className="icon-button" onClick={onBack} aria-label="Go back"><ArrowLeft /></button><Brand compact /><span className="icon-spacer" /></header><section className="call-center"><p className="eyebrow">Calling KopiKaki</p><h1>{status === "listening" ? "I’m listening…" : status === "connecting" ? "Starting the call…" : status === "thinking" ? "Finding a kaki…" : "What do you feel like doing?"}</h1><div className={status === "listening" ? "voice-orb listening" : "voice-orb"} aria-hidden="true"><Brand compact /></div><button className={status === "listening" ? "voice-button stop" : "voice-button"} onClick={status === "listening" ? stopVoice : startVoice} disabled={status === "connecting" || status === "thinking"}>{status === "listening" ? <Square fill="currentColor" aria-hidden="true" /> : <Mic fill="currentColor" aria-hidden="true" />}{status === "listening" ? "Stop listening" : "Tap to speak"}</button></section><div className="text-fallback"><label htmlFor="request">Or type what you want</label><textarea id="request" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Tomorrow morning I want to play pickleball near Bishan." rows={3} />{error && <p className="error-message" role="alert">{error}</p>}<button className="primary-button" onClick={findMatch} disabled={status === "thinking"}><Search size={23} aria-hidden="true" />{status === "thinking" ? "Finding someone…" : "Find my kaki"}</button></div></main>;
}
