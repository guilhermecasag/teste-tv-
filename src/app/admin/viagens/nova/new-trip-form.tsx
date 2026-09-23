"use client";

import { useRouter } from "next/navigation";
import { TripForm } from "../trip-form";
import { createTripAction } from "@/actions/trips";

type Option = { id: string; name: string };

export function NewTripForm({
  clients,
  montadores,
  espectadores,
}: {
  clients: Option[];
  montadores: Option[];
  espectadores: Option[];
}) {
  const router = useRouter();

  return (
    <TripForm
      action={createTripAction}
      clients={clients}
      montadores={montadores}
      espectadores={espectadores}
      submitLabel="Criar viagem"
      onSuccess={(tripId) => router.push(`/admin/viagens/${tripId}`)}
    />
  );
}
