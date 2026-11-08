import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./dark.css";
export const viewport: Viewport = {
  themeColor: "#100b1d",
  colorScheme: "dark",
};
export const metadata: Metadata = {
  title: "CROMATCH · Tu colección, en juego",
  description:
    "Tu álbum de fútbol, tus repetidos y tu próximo intercambio. Colecciona y conecta.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CROMATCH", statusBarStyle: "default" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
