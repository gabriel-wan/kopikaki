"use client";

import { ChevronRight, Search, Users } from "lucide-react";
import { useState } from "react";
import type { Candidate } from "@/lib/domain";
import { Brand } from "./brand";

export function KakisScreen({
  kakis,
  loading,
  onCall,
  onSelect,
}: {
  kakis: Candidate[];
  loading: boolean;
  onCall: () => void;
  onSelect: (kaki: Candidate) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("en-SG");
  const filtered = needle ? kakis.filter((kaki) => kaki.name.toLocaleLowerCase("en-SG").includes(needle)) : kakis;

  return <main className="screen"><header className="topbar"><Brand compact /></header><div className="page-title kakis-header"><div><p className="eyebrow">Your community</p><h1>My Kakis</h1><p>Friendly people you can meet nearby.</p></div>{!loading && kakis.length > 0 && <button className="link-button" onClick={onCall}>Add Kaki</button>}</div><section aria-live="polite">{loading ? <div className="empty-card">Finding your kakis…</div> : kakis.length === 0 ? <div className="meetup-empty-state"><Users className="meetup-empty-icon" size={48} aria-hidden="true" /><h2>You haven’t met any kakis yet</h2><p>Call KopiKaki and we’ll introduce you to someone nearby.</p><button className="meetup-discover-button" onClick={onCall}>Find my first kaki</button></div> : <><div className="kaki-search"><Search size={20} aria-hidden="true" /><input type="search" aria-label="Search my kakis" placeholder="Search my kakis" value={query} onChange={(event) => setQuery(event.target.value)} /></div>{filtered.length === 0 ? <p className="empty-card">No kakis match “{query}”.</p> : <div className="kaki-list">{filtered.map((kaki, index) => <button type="button" className="kaki-row" key={kaki.id} onClick={() => onSelect(kaki)}><span className={`avatar tone-${(index % 3) + 1}`} aria-hidden="true">{kaki.name.split(" ").at(-1)?.[0]}</span><span className="kaki-info"><strong>{kaki.name}</strong>{kaki.activities.length > 0 && <small>{kaki.activities.slice(0, 2).join(", ")}</small>}</span><ChevronRight className="chevron" size={22} aria-hidden="true" /></button>)}</div>}</>}</section></main>;
}
