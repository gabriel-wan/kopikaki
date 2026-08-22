import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  const size = compact ? 54 : 76;
  return <Image className={compact ? "brand-image compact" : "brand-image"} src="/kopikaki-logo.png" alt="KopiKaki" width={size} height={size} priority />;
}
