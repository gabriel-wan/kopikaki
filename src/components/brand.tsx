import { Coffee } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand" aria-label="KopiKaki"><span className="brand-mark" aria-hidden="true"><Coffee size={compact ? 20 : 25} strokeWidth={2.5} /></span><span className={compact ? "brand-name compact" : "brand-name"}>KopiKaki</span></div>;
}
