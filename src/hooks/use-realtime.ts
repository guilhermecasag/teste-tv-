"use client";

import { useEffect, useRef } from "react";

/**
 * Conecta ao SSE (/api/realtime) e chama onUpdate a cada evento. Usado
 * pelo sino de notificacoes e pelas paginas de viagem para atualizar sem
 * F5 (secoes 22/23 do briefing).
 */
export function useRealtime(tripId: string | null, onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const url = tripId ? `/api/realtime?tripId=${tripId}` : "/api/realtime";
    const source = new EventSource(url);

    source.addEventListener("update", () => onUpdateRef.current());

    return () => source.close();
  }, [tripId]);
}
