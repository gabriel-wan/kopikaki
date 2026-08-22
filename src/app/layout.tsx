import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "KopiKaki — Your social concierge", description: "Call KopiKaki and turn what you feel like doing into a real meetup.", applicationName: "KopiKaki", manifest: "/manifest.webmanifest", icons: { icon: [{ url: "/kopikaki-logo.png", type: "image/png" }], apple: "/kopikaki-logo.png" }, appleWebApp: { capable: true, statusBarStyle: "default", title: "KopiKaki" } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#e62d24" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
