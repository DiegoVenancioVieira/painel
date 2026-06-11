import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { ConnectionIndicator } from "./ConnectionIndicator";

export function Header({ showSession = true }: { showSession?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sos-600 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M12 2 1 21h22L12 2zm0 6 6.5 11h-13L12 8zm-1 4v3h2v-3h-2zm0 4v2h2v-2h-2z" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight">Painel SOS</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-slate-600 hover:text-slate-900">
            Alertas
          </Link>
          <Link href="/mapa" className="text-slate-600 hover:text-slate-900">
            Mapa
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
