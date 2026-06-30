// Tipos TypeScript refletindo o schema do Directus do app "Botão do Pânico".

export type StatusAlerta = "ativo" | "resolvido" | "teste";

export interface Usuaria {
  id: string;
  nome: string;
  telefone: string;
  validada: boolean;
  data_criacao: string;
  /** Secreto — só usado server-side no app da usuária; nunca retornado ao client. */
  token?: string | null;
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

export type TipoViatura = "PM" | "GCM" | "parceira";

export interface Viatura {
  id: string;
  identificador: string;
  tipo: TipoViatura;
  placa: string | null;
  telefone_contato: string | null;
  ativa: boolean;
  ultima_lat: number | null;
  ultima_lng: number | null;
  ultima_velocidade: number | null;
  ultima_direcao: number | null;
  ultimo_ping: string | null;
  /** Secreto — só usado server-side na ingestão; nunca retornado ao client. */
  token?: string | null;
}

export interface ViaturaPosicao {
  id: string;
  viatura_id: string | Viatura | null;
  latitude: number;
  longitude: number;
  velocidade: number | null;
  direcao: number | null;
  data_hora: string;
}

export type StatusDespacho =
  | "designada"
  | "a_caminho"
  | "no_local"
  | "encerrada";

export interface Despacho {
  id: string;
  alerta_id: string | Alerta | null;
  viatura_id: string | Viatura | null;
  status: StatusDespacho;
  observacao: string | null;
  data_designacao: string;
  data_chegada: string | null;
}

// Schema agregado para o SDK do Directus
export interface DirectusSchema {
  usuarias: Usuaria[];
  guardioes: Guardiao[];
  alertas: Alerta[];
  localizacoes_alerta: LocalizacaoAlerta[];
  viaturas: Viatura[];
  viatura_posicoes: ViaturaPosicao[];
  despachos: Despacho[];
}
