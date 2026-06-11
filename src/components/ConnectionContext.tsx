"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type ConnectionStatus = "online" | "reconnecting" | "offline";

interface ConnectionCtx {
  status: ConnectionStatus;
  setStatus: (s: ConnectionStatus) => void;
}

const Ctx = createContext<ConnectionCtx>({
  status: "online",
  setStatus: () => {},
});

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusState] = useState<ConnectionStatus>("online");
  const setStatus = useCallback((s: ConnectionStatus) => setStatusState(s), []);
  return <Ctx.Provider value={{ status, setStatus }}>{children}</Ctx.Provider>;
}

export function useConnection() {
  return useContext(Ctx);
}
