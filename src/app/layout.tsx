import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./dark.css";
import "./glass.css";
import localFont from "next/font/local";
const bodyFont = localFont({
  src: "../fonts/Manrope-Variable.ttf",
  variable: "--font-body",
  display: "swap",
});
export const viewport: Viewport = {
  themeColor: "#573180",
  colorScheme: "dark",
};
export const metadata: Metadata = {
  title: "CROMATCH · Tu colección, en juego",
  description:
    "Tu álbum de fútbol, tus repetidos y tu próximo intercambio. Colecciona y conecta.",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false, noarchive: true },
  appleWebApp: { capable: true, title: "CROMATCH", statusBarStyle: "default" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={bodyFont.variable}>{children}</body>
    </html>
  );
}
