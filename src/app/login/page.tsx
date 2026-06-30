"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErro(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setErro("Erro de rede. Verifique a conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-aju-900">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-aju-500 focus:ring-2 focus:ring-aju-500/25"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-aju-900">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none transition focus:border-aju-500 focus:ring-2 focus:ring-aju-500/25"
        />
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200"
        >
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-aju-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-aju-700 focus:ring-2 focus:ring-aju-500/40 disabled:opacity-60"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4">
      {/* Plano de fundo institucional */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aju-50 via-white to-aju-100" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-aju-ring opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-aju-ring opacity-20 blur-3xl" />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        {/* Faixa superior com gradiente da marca */}
        <div className="h-1.5 w-full bg-aju-ring" />
        <div className="p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-aracaju.png"
              alt="Prefeitura de Aracaju"
              className="h-20 w-20 drop-shadow-sm"
            />
            <div>
              <h1 className="text-xl font-bold text-aju-900">Painel SOS Mulher</h1>
              <p className="mt-1 text-sm text-slate-500">
                Acesso restrito às operadoras de plantão.
              </p>
            </div>
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-8 py-3 text-center text-xs text-slate-400">
          Prefeitura de Aracaju · Ser Mulher
        </div>
      </div>
    </main>
  );
}
