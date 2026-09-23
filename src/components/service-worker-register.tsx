"use client";

import { useEffect } from "react";

/**
 * Registra o service worker assim que o app carrega, independente de o
 * usuario ter ativado push - e o que torna o app instalavel (PWA,
 * secao 36 do briefing) e habilita cache basico para conexao ruim.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
