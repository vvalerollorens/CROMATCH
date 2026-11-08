import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./dark.css";
import "./vintage.css";
import localFont from "next/font/local";
const bodyFont = localFont({
  src: [
    { path: "../fonts/Barlow-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Barlow-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});
const displayFont = localFont({
  src: "../fonts/BarlowCondensed-Bold.ttf",
  weight: "700",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});
export const viewport: Viewport = {
  themeColor: "#21162d",
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
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
