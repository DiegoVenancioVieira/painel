"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Alerta } from "@/types/schema";
import { useConnection } from "@/components/ConnectionContext";

interface Opcoes {
  status: string; // ativo|resolvido|teste|todos
  intervaloMs?: number;
  onNovoAtivo?: (a: Alerta) => void;
}

interface Retorno {
  alertas: Alerta[];
  total: number;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
}

/**
 * Mantém a lista de alertas atualizada.
 *
 * Estratégia: polling no endpoint autenticado /api/alertas a cada `intervaloMs`.
 * (O WebSocket do Directus exigiria expor o token de acesso ao browser; como a
 * sessão usa cookies httpOnly por segurança, o polling server-proxy é a opção
 * robusta. Ver README para habilitar WebSocket com token dedicado.)
 *
 * Detecta novos alertas 'ativo' entre as sondagens e dispara `onNovoAtivo`.
 */
export function useAlertasRealtime({
  status,
  intervaloMs = 10000,
  onNovoAtivo,
}: Opcoes): Retorno {
  const router = useRouter();
  const { setStatus: setConexao } = useConnection();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const idsConhecidos = useRef<Set<string>>(new Set());
  const primeiraCarga = useRef(true);
  const onNovoRef = useRef(onNovoAtivo);
  onNovoRef.current = onNovoAtivo;

  const buscar = useCallback(async () => {
    try {
      const res = await fetch(`/api/alertas?status=${status}&limit=50`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("Falha na busca");

      const json = (await res.json()) as { data: Alerta[]; total: number };

      // Detecta novos ativos (exceto na primeira carga).
      if (!primeiraCarga.current && onNovoRef.current) {
        for (const a of json.data) {
          if (a.status === "ativo" && !idsConhecidos.current.has(a.id)) {
            onNovoRef.current(a);
          }
        }
      }
      json.data.forEach((a) => idsConhecidos.current.add(a.id));
      primeiraCarga.current = false;

      setAlertas(json.data);
      setTotal(json.total);
      setErro(null);
      setConexao("online");
    } catch {
      setErro("Não foi possível atualizar. Tentando novamente…");
      setConexao("reconnecting");
    } finally {
      setCarregando(false);
    }
  }, [status, router, setConexao]);

  // Reset ao trocar de filtro.
  useEffect(() => {
    primeiraCarga.current = true;
    idsConhecidos.current = new Set();
    setCarregando(true);
    buscar();
    const id = setInterval(buscar, intervaloMs);
    return () => clearInterval(id);
  }, [buscar, intervaloMs]);

  return { alertas, total, carregando, erro, recarregar: buscar };
}
