import { Home, Phone, Users } from "lucide-react";

export type Tab = "home" | "call" | "kakis";

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const items = [{ id: "home" as const, label: "Home", Icon: Home }, { id: "call" as const, label: "Call", Icon: Phone }, { id: "kakis" as const, label: "My Kakis", Icon: Users }];
  return <nav className="bottom-nav" aria-label="Main navigation">{items.map(({ id, label, Icon }) => <button key={id} className={active === id ? "nav-item active" : "nav-item"} aria-current={active === id ? "page" : undefined} onClick={() => onChange(id)}><Icon size={24} aria-hidden="true" /><span>{label}</span></button>)}</nav>;
}
