"use client";

import { useRouter } from "next/navigation";
import { useRealtime } from "@/hooks/use-realtime";

/**
 * Atualiza a pagina da viagem automaticamente quando algo muda (progresso,
 * status, fotos, pendencias) - secoes 22/23 do briefing. Nao renderiza
 * nada visivel.
 */
export function TripRealtimeRefresh({ tripId }: { tripId: string }) {
  const router = useRouter();
  useRealtime(tripId, () => router.refresh());
  return null;
}
