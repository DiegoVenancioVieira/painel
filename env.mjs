// Carrega variáveis de .env.local (sem dependências) e expõe URL/TOKEN para os
// scripts de bootstrap/seed. Mantém segredos fora do código-fonte.

import { readFileSync } from "node:fs";

try {
  // globalThis.URL: evita sombreamento pelo `export const URL` abaixo (TDZ).
  const txt = readFileSync(
    new globalThis.URL("./.env.local", import.meta.url),
    "utf8",
  );
  for (const linha of txt.split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // .env.local ausente — usa apenas o ambiente do processo
}

export const URL = (
  process.env.DIRECTUS_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  ""
).replace(/\/+$/, "");

export const TOKEN = process.env.DIRECTUS_TOKEN || "";

if (!URL || !TOKEN) {
  console.error(
    "ERRO: defina NEXT_PUBLIC_DIRECTUS_URL (ou DIRECTUS_URL) e DIRECTUS_TOKEN " +
      "em .env.local ou no ambiente.",
  );
  process.exit(1);
}
