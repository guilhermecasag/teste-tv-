"use client";

import { Modal } from "@/components/modal";
import { TripForm } from "../trip-form";
import { updateTripAction } from "@/actions/trips";

type Option = { id: string; name: string };

type TripDefaults = {
  clientId: string;
  address: string | null;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  status: string;
  progressMethod: string;
  notes: string | null;
  memberIds: string[];
  viewerIds: string[];
};

export function EditTripButton({
  tripId,
  clients,
  montadores,
  espectadores,
  defaultValues,
}: {
  tripId: string;
  clients: Option[];
  montadores: Option[];
  espectadores: Option[];
  defaultValues: TripDefaults;
}) {
  return (
    <Modal title="Editar viagem" trigger={<button className="btn-secondary">Editar viagem</button>}>
      {(close) => (
        <TripForm
          action={updateTripAction.bind(null, tripId)}
          clients={clients}
          montadores={montadores}
          espectadores={espectadores}
          defaultValues={defaultValues}
          submitLabel="Salvar alterações"
          onSuccess={() => close()}
        />
      )}
    </Modal>
  );
}
