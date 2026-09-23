import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MontadorShell } from "@/components/montador-shell";
import { EquipmentList } from "@/components/equipment/equipment-list";
import { getActiveTripForMontador } from "@/lib/trips";

export default async function MontadorMontagemPage() {
  const session = await auth();
  if (!session) return null;

  const activeTrip = await getActiveTripForMontador(session.user.id);
  if (!activeTrip) {
    return (
      <MontadorShell userName={session.user.name ?? ""}>
        <p className="text-sm text-muted">Nenhuma viagem alocada para você no momento.</p>
      </MontadorShell>
    );
  }

  const [trip, montadores] = await Promise.all([
    prisma.trip.findUniqueOrThrow({
      where: { id: activeTrip.id },
      include: {
        client: true,
        equipment: {
          include: {
            responsible: true,
            photos: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
            issues: { include: { responsible: true }, orderBy: { createdAt: "desc" } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "MONTADOR", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <MontadorShell userName={session.user.name ?? ""}>
      <h1 className="text-xl font-semibold text-foreground">{trip.client.name}</h1>
      <p className="text-sm text-muted">Toque em um equipamento para ver detalhes.</p>

      <div className="mt-4">
        <EquipmentList
          tripId={trip.id}
          equipment={trip.equipment}
          progressMethod={trip.progressMethod}
          montadores={montadores}
          canManage={false}
        />
      </div>
    </MontadorShell>
  );
}
