import Image from "next/image";

export function Brand({ compact = false, wordmark = false }: { compact?: boolean; wordmark?: boolean }) {
  if (wordmark) {
    return <Image className="brand-wordmark" src="/kopikaki-wordmark.png" alt="KopiKaki" width={170} height={57} priority />;
  }
  const size = compact ? 54 : 76;
  return <Image className={compact ? "brand-image compact" : "brand-image"} src="/kopikaki-logo.png" alt="KopiKaki" width={size} height={size} priority />;
}
