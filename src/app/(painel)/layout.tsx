import { Header } from "@/components/Header";
import { ConnectionProvider } from "@/components/ConnectionContext";
import { ToastProvider } from "@/components/Toast";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConnectionProvider>
      <ToastProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="w-full flex-1">{children}</main>
        </div>
      </ToastProvider>
    </ConnectionProvider>
  );
}
