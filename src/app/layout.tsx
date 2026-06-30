import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel SOS — Botão do Pânico",
  description: "Monitoramento de alertas de emergência em tempo real.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/logo-aracaju.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
