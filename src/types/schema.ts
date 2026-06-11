// Tipos TypeScript refletindo o schema do Directus do app "Botão do Pânico".

export type StatusAlerta = "ativo" | "resolvido" | "teste";

export interface Usuaria {
  id: string;
  nome: string;
  telefone: string;
  validada: boolean;
  data_criacao: string;
}

export interface Guardiao {
  id: string;
  usuaria_id: string | Usuaria | null;
  nome: string;
  telefone: string;
}

export interface Alerta {
  id: string;
  usuaria_id: string | Usuaria | null;
  status: StatusAlerta;
  latitude_inicial: number | null;
  longitude_inicial: number | null;
  audio: string | null;
  sincronizado_offline: boolean;
  data_criacao: string;
  // Campos adicionados no Prompt 6
  resolvido_por?: string | null;
  data_resolucao?: string | null;
}

export interface LocalizacaoAlerta {
  id: string;
  alerta_id: string | Alerta | null;
  latitude: number;
  longitude: number;
  data_hora: string;
}

// Schema agregado para o SDK do Directus
export interface DirectusSchema {
  usuarias: Usuaria[];
  guardioes: Guardiao[];
  alertas: Alerta[];
  localizacoes_alerta: LocalizacaoAlerta[];
}
