import { prisma } from "@/lib/prisma";

const STATUS_PRIORITY: Record<string, number> = {
  EM_MONTAGEM: 0,
  EM_DESLOCAMENTO: 1,
  PAUSADA: 2,
  PLANEJADA: 3,
  CONCLUIDA: 4,
  CANCELADA: 5,
};

/**
 * Escolhe a viagem mais relevante do montador para as telas de Viagem e
 * Montagem (a navegacao do montador tem uma unica aba para cada, nao uma
 * lista - secao 5 do briefing).
 */
export async function getActiveTripForMontador(userId: string) {
  const memberships = await prisma.tripUser.findMany({
    where: { userId },
    include: { trip: { include: { client: true } } },
  });

  if (memberships.length === 0) return null;

  const sorted = memberships
    .map((m) => m.trip)
    .sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] ?? 9;
      const pb = STATUS_PRIORITY[b.status] ?? 9;
      if (pa !== pb) return pa - pb;
      return a.startDate.getTime() - b.startDate.getTime();
    });

  return sorted[0];
}

export async function listViewerTrips(userId: string) {
  const access = await prisma.tripViewer.findMany({
    where: { userId },
    include: { trip: { include: { client: true, equipment: true } } },
    orderBy: { trip: { startDate: "desc" } },
  });

  return access.map((a) => a.trip);
}
