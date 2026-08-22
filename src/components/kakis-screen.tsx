import { MapPin, Users } from "lucide-react";
import type { Candidate } from "@/lib/domain";
import { Brand } from "./brand";

export function KakisScreen({ kakis, loading }: { kakis: Candidate[]; loading: boolean }) {
  return <main className="screen"><header className="topbar"><Brand compact /></header><div className="page-title"><p className="eyebrow">Your community</p><h1>My Kakis</h1><p>Friendly people you can meet nearby.</p></div><section className="kaki-list" aria-busy={loading}>{loading ? <div className="empty-card">Finding your kakis…</div> : kakis.map((kaki, index) => <article className="kaki-row" key={kaki.id}><span className={`avatar tone-${(index % 3) + 1}`} aria-hidden="true">{kaki.name.split(" ").at(-1)?.[0]}</span><span className="kaki-info"><strong>{kaki.name}</strong><small><MapPin size={16} aria-hidden="true" />{kaki.neighborhood} · {kaki.activities.slice(0, 2).join(", ")}</small></span></article>)}{!loading && kakis.length === 0 && <div className="empty-card"><Users size={28} aria-hidden="true" />No kakis seeded yet.</div>}</section></main>;
}
