"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Alerta,
  Despacho,
  Guardiao,
  LocalizacaoAlerta,
} from "@/types/schema";
import { StatusBadge } from "./StatusBadge";
import { AudioPlayer } from "./AudioPlayer";
import { GuardiansList } from "./GuardiansList";
import { ResolveButton } from "./ResolveButton";
import { DispatchPanel } from "./DispatchPanel";
import {
  formatarDataHora,
  nomeUsuaria,
  telefoneUsuaria,
  telefoneWhatsapp,
} from "@/lib/format";

const AlertMap = dynamic(() => import("./AlertMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      Carregando mapa…
    </div>
  ),
});

interface Dados {
  alerta: Alerta;
  guardioes: Guardiao[];
  localizacoes: LocalizacaoAlerta[];
  despachos: Despacho[];
}

export function AlertDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const buscar = useCallback(async () => {
    try {
      const res = await fetch(`/api/alertas/${id}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 404) {
        setErro("Alerta não encontrado.");
        return;
      }
      if (!res.ok) throw new Error();
      setDados((await res.json()) as Dados);
      setErro(null);
    } catch {
      setErro("Não foi possível carregar o alerta.");
    } finally {
      setCarregando(false);
    }
  }, [id, router]);

  useEffect(() => {
    buscar();
  }, [buscar]);

  // Atualização ao vivo do rastro enquanto o alerta estiver ativo.
  useEffect(() => {
    if (dados?.alerta.status !== "ativo") return;
    const t = setInterval(buscar, 10000);
    return () => clearInterval(t);
  }, [dados?.alerta.status, buscar]);

  if (carregando) {
    return <div className="py-20 text-center text-slate-400">Carregando…</div>;
  }
  if (erro) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">{erro}</p>
        <Link href="/" className="mt-3 inline-block text-sm text-sos-600 hover:underline">
          ← Voltar para os alertas
        </Link>
      </div>
    );
  }
  if (!dados) return null;

  const { alerta, guardioes, localizacoes } = dados;
  const nome = nomeUsuaria(alerta.usuaria_id);
  const tel = telefoneUsuaria(alerta.usuaria_id);
  const wpp = telefoneWhatsapp(tel);
  const inicial =
    alerta.latitude_inicial != null && alerta.longitude_inicial != null
      ? { lat: alerta.latitude_inicial, lng: alerta.longitude_inicial }
      : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            ← Alertas
          </Link>
          <h1 className="text-xl font-bold">{nome}</h1>
          <StatusBadge status={alerta.status} />
        </div>
        {alerta.status === "ativo" && (
          <ResolveButton alertaId={alerta.id} onResolvido={buscar} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Mapa */}
        <div className="lg:col-span-2">
          <div className="h-[420px] overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <AlertMap inicial={inicial} rastro={localizacoes} />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {localizacoes.length} ponto(s) de localização registrados.
          </p>
        </div>

        {/* Painel lateral */}
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Usuária</h2>
            <p className="font-medium">{nome}</p>
            {tel && <p className="text-sm text-slate-500">{tel}</p>}
            <div className="mt-2 flex gap-1.5">
              {tel && (
                <a
                  href={`tel:${tel}`}
                  className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  Ligar
                </a>
              )}
              {wpp && (
                <a
                  href={`https://wa.me/${wpp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              Gravação de áudio
            </h2>
            <AudioPlayer audioId={alerta.audio} />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Guardiões</h2>
            <GuardiansList guardioes={guardioes} />
          </section>

          <DispatchPanel
            alertaId={alerta.id}
            despachos={dados.despachos}
            onChange={buscar}
          />

          <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Detalhes</h2>
            <dl className="space-y-1 text-slate-600">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Criado em</dt>
                <dd>{formatarDataHora(alerta.data_criacao)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Sincronizado offline</dt>
                <dd>{alerta.sincronizado_offline ? "Sim" : "Não"}</dd>
              </div>
              {alerta.data_resolucao && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Resolvido em</dt>
                  <dd>{formatarDataHora(alerta.data_resolucao)}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
