import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { ConnectionIndicator } from "./ConnectionIndicator";

export function Header({ showSession = true }: { showSession?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      {/* Fio de gradiente da marca */}
      <div className="h-1 w-full bg-aju-ring" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-aracaju.png"
            alt="Prefeitura de Aracaju"
            className="h-9 w-9"
          />
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-aju-900">
              Painel SOS Mulher
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-wide text-aju-600">
              Prefeitura de Aracaju
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="font-medium text-slate-600 hover:text-aju-700">
            Início
          </Link>
          {showSession && (
            <>
              <ConnectionIndicator />
              <LogoutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
