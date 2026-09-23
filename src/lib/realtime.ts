import { EventEmitter } from "events";

/**
 * Barramento de eventos em processo, usado pelas rotas SSE para empurrar
 * atualizacoes sem o cliente precisar dar F5 (secoes 22/23 do briefing).
 *
 * Ancorado em globalThis: o Next.js compila server actions e route
 * handlers em "layers" separadas, cada uma com sua propria instancia de
 * modulo - sem isso, o publish() de uma action nunca alcancaria o
 * listener da rota /api/realtime, mesmo no mesmo processo Node (mesmo
 * padrao usado em src/lib/prisma.ts para o motivo equivalente).
 *
 * Funciona para um unico processo Node (como este projeto roda em dev e
 * como rodaria num deploy de instancia unica). Num deploy com varias
 * instancias, isso precisaria de um pub/sub compartilhado (Redis, etc.) -
 * documentado no README.
 */
const globalForRealtime = globalThis as unknown as { realtimeBus?: EventEmitter };

const bus = globalForRealtime.realtimeBus ?? new EventEmitter();
bus.setMaxListeners(0);

if (process.env.NODE_ENV !== "production") {
  globalForRealtime.realtimeBus = bus;
}

export function publish(channel: string, data: unknown) {
  bus.emit(channel, data);
}

export function subscribe(channel: string, listener: (data: unknown) => void) {
  bus.on(channel, listener);
  return () => bus.off(channel, listener);
}

export function userChannel(userId: string) {
  return `user:${userId}`;
}

export function tripChannel(tripId: string) {
  return `trip:${tripId}`;
}
