"use client";

import { collection, onSnapshot, orderBy, query, type Unsubscribe } from "firebase/firestore";
import { ArrowLeft, Send, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { chatId } from "@/lib/chat";
import type { Candidate } from "@/lib/domain";
import { apiPost, auth, db } from "@/lib/firebase-client";

type Message = { id: string; senderId: string; text: string };

export function ChatScreen({ kaki, onBack, onCall }: { kaki: Candidate; onBack: () => void; onCall: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = auth.currentUser?.uid ?? "";

  useEffect(() => {
    if (!kaki.hasAccount || !myId) return;
    const messagesQuery = query(
      collection(db, "chats", chatId(myId, kaki.id), "messages"),
      orderBy("createdAt"),
    );
    const unsubscribe: Unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          senderId: doc.data().senderId as string,
          text: doc.data().text as string,
        })),
      );
    });
    return unsubscribe;
  }, [kaki.hasAccount, kaki.id, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await apiPost("/api/chat", { kakiId: kaki.id, text });
      setText("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send that message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="screen chat-screen">
      <header className="topbar call-topbar">
        <button className="icon-button" onClick={onBack} aria-label="Go back">
          <ArrowLeft />
        </button>
        <h1 className="chat-title">{kaki.name}</h1>
        <span className="icon-spacer" />
      </header>
      {!kaki.hasAccount ? (
        <div className="meetup-empty-state">
          <Users className="meetup-empty-icon" size={48} aria-hidden="true" />
          <h2>{kaki.name} isn’t on KopiKaki yet</h2>
          <p>Ask KopiKaki to help you plan something with them instead.</p>
          <button className="meetup-discover-button" onClick={onCall}>Ask KopiKaki</button>
        </div>
      ) : (
        <>
          <section className="chat-log" aria-live="polite">
            {messages.length === 0 && <p className="chat-empty">Say hello to {kaki.name}!</p>}
            {messages.map((message) => (
              <p key={message.id} className={message.senderId === myId ? "chat-bubble mine" : "chat-bubble"}>
                {message.text}
              </p>
            ))}
            <div ref={bottomRef} />
          </section>
          {error && <p className="error-message" role="alert">{error}</p>}
          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <input
              type="text"
              aria-label={`Message ${kaki.name}`}
              placeholder="Type a message…"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <button type="submit" className="icon-button chat-send" disabled={sending || !text.trim()} aria-label="Send message">
              <Send />
            </button>
          </form>
        </>
      )}
    </main>
  );
}
