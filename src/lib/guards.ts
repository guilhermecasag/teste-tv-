import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Acesso restrito ao administrador.");
  }
  return session;
}

export async function requireSession() {
  const session = await auth();
  if (!session) {
    throw new Error("É necessário estar autenticado.");
  }
  return session;
}

/**
 * Permite ADMIN ou o MONTADOR alocado na viagem (registrar andamento,
 * fotos, observacoes e pendencias - secao 6 do briefing).
 */
export async function requireTripMember(tripId: string) {
  const session = await requireSession();
  if (session.user.role === "ADMIN") return session;

  if (session.user.role === "MONTADOR") {
    const membership = await prisma.tripUser.findUnique({
      where: { tripId_userId: { tripId, userId: session.user.id } },
    });
    if (membership) return session;
  }

  throw new Error("Você não tem acesso a esta viagem.");
}

/**
 * Permite ADMIN ou o ESPECTADOR autorizado a acompanhar a viagem (somente
 * leitura - secao 6 do briefing).
 */
export async function requireTripViewerAccess(tripId: string) {
  const session = await requireSession();
  if (session.user.role === "ADMIN") return session;

  if (session.user.role === "ESPECTADOR") {
    const access = await prisma.tripViewer.findUnique({
      where: { tripId_userId: { tripId, userId: session.user.id } },
    });
    if (access) return session;
  }

  throw new Error("Você não tem acesso a esta viagem.");
}
