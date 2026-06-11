import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel SOS — Botão do Pânico",
  description: "Monitoramento de alertas de emergência em tempo real.",
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
