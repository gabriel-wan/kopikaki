"use client";

import { GoogleGenAI, Modality, type FunctionCall, type Session } from "@google/genai";
import { ArrowLeft, Mic, Search, Square } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { type Candidate, type MatchIntent, type MatchTier, type Meetup } from "@/lib/domain";
import { apiPost } from "@/lib/firebase-client";
import { createAudioPlayer, streamMicrophone } from "@/lib/live-audio";
import { voiceConfirmation, type VoiceConfirmation } from "@/lib/voice-confirmation";
import {
  CONFIRM_KAKI_MATCH,
  FIND_AVAILABILITY,
  FORGET_NOTE,
  LIVE_TOOLS,
  MY_STATUS,
  PROPOSE_KAKI_MATCH,
  REMEMBER_NOTE,
  SET_AVAILABILITY,
  UPDATE_KAKI_LIST,
  UPDATE_PROFILE,
} from "@/lib/live-tools";

const MEMORY_TOOLS = new Set([
  REMEMBER_NOTE,
  FORGET_NOTE,
  SET_AVAILABILITY,
  FIND_AVAILABILITY,
  UPDATE_KAKI_LIST,
]);
import { Brand } from "./brand";

type CallStatus = "ready" | "connecting" | "listening" | "thinking";

export function CallScreen({
  onBack,
  onTranscript,
  onVoiceConfirmed,
}: {
  onBack: () => void;
  onTranscript: (transcript: string) => Promise<void>;
  onVoiceConfirmed: (confirmation: VoiceConfirmation) => void;
}) {
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<CallStatus>("ready");
  const [error, setError] = useState("");
  const mountedRef = useRef(true);
  const sessionRef = useRef<Session | null>(null);
  const stopMicRef = useRef<null | (() => Promise<void>)>(null);
  const closePlayerRef = useRef<null | (() => Promise<void>)>(null);
  const proposedIntentRef = useRef<MatchIntent | null>(null);
  const pendingHangupRef = useRef(false);

  const stopVoice = useCallback(async (resetStatus = true) => {
    const stopMic = stopMicRef.current;
    const session = sessionRef.current;
    const closePlayer = closePlayerRef.current;
    stopMicRef.current = null;
    sessionRef.current = null;
    closePlayerRef.current = null;
    proposedIntentRef.current = null;
    pendingHangupRef.current = false;

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

  async function handlePropose(call: FunctionCall, session: Session) {
    const request = typeof call.args?.request === "string" ? call.args.request : "";
    try {
      const result = await apiPost<{
        match: Candidate | null; reason?: string; attempted: MatchTier[]; intent: MatchIntent;
      }>("/api/match", { transcript: request, confirm: false });
      proposedIntentRef.current = result.match ? result.intent : null;
      session.sendToolResponse({
        functionResponses: [{
          id: call.id,
          name: call.name,
          response: result.match
            ? {
                found: true,
                name: result.match.name,
                reason: result.reason,
                joining: result.match.kind === "meetup",
                alreadyGoing: result.match.members ?? [],
              }
            : { found: false, attempted: result.attempted },
        }],
      });
    } catch (cause) {
      proposedIntentRef.current = null;
      session.sendToolResponse({
        functionResponses: [{
          id: call.id,
          name: call.name,
          response: { error: cause instanceof Error ? cause.message : "Could not check for a match." },
        }],
      });
    }
  }

  async function handleConfirm(call: FunctionCall, session: Session) {
    const intent = proposedIntentRef.current;
    if (!intent) {
      session.sendToolResponse({
        functionResponses: [{ id: call.id, name: call.name, response: { error: "No proposal to confirm yet." } }],
      });
      return;
    }
    try {
      const result = await apiPost<{ meetup: Meetup; joined?: boolean }>("/api/match", { intent, confirm: true });
      pendingHangupRef.current = true;
      session.sendToolResponse({
        functionResponses: [{
          id: call.id,
          name: call.name,
          response: {
            booked: true,
            joined: result.joined === true,
            title: result.meetup.title,
            when: result.meetup.timeLabel,
            venue: result.meetup.venue,
            going: result.meetup.participantNames.length,
          },
        }],
      });
      onVoiceConfirmed(voiceConfirmation(result.meetup, result.joined));
    } catch (cause) {
      session.sendToolResponse({
        functionResponses: [{
          id: call.id,
          name: call.name,
          response: { error: cause instanceof Error ? cause.message : "Could not confirm the meetup." },
        }],
      });
    }
  }

  async function handleServerTool(call: FunctionCall, session: Session, path: string, body: object) {
    try {
      const result = await apiPost<Record<string, unknown>>(path, body);
      session.sendToolResponse({
        functionResponses: [{ id: call.id, name: call.name, response: result }],
      });
    } catch (cause) {
      session.sendToolResponse({
        functionResponses: [{
          id: call.id,
          name: call.name,
          response: { error: cause instanceof Error ? cause.message : "Something went wrong. Please try again." },
        }],
      });
    }
  }

  async function startVoice() {
    await stopVoice(false);
    setError("");
    setStatus("connecting");
    try {
      const { token, model, systemInstruction } = await apiPost<{
        token: string; model: string; systemInstruction: string;
      }>("/api/live-token");
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
          systemInstruction,
          tools: LIVE_TOOLS,
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
            if (liveSession) {
              for (const call of message.toolCall?.functionCalls ?? []) {
                if (call.name === PROPOSE_KAKI_MATCH) void handlePropose(call, liveSession);
                else if (call.name === CONFIRM_KAKI_MATCH) void handleConfirm(call, liveSession);
                else if (call.name && MEMORY_TOOLS.has(call.name)) {
                  void handleServerTool(call, liveSession, "/api/memory", { operation: call.name, args: call.args ?? {} });
                } else if (call.name === UPDATE_PROFILE) {
                  void handleServerTool(call, liveSession, "/api/profile", { ...call.args });
                } else if (call.name === MY_STATUS) {
                  void handleServerTool(call, liveSession, "/api/me", {});
                }
              }
            }
            if (pendingHangupRef.current && message.serverContent?.turnComplete) {
              pendingHangupRef.current = false;
              void stopVoice();
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
          <Image className="voice-character" src="/kopikaki-voice.png" alt="" width={172} height={172} priority />
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
