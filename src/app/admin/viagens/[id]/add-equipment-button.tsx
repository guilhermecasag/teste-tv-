"use client";

import { Modal } from "@/components/modal";
import { EquipmentForm } from "./equipment-form";
import { createEquipmentAction } from "@/actions/equipment";

type Option = { id: string; name: string };

export function AddEquipmentButton({
  tripId,
  montadores,
  progressMethod,
}: {
  tripId: string;
  montadores: Option[];
  progressMethod: string;
}) {
  return (
    <Modal title="Novo equipamento" trigger={<button className="btn-primary">+ Equipamento</button>}>
      {(close) => (
        <EquipmentForm
          action={createEquipmentAction.bind(null, tripId)}
          montadores={montadores}
          progressMethod={progressMethod}
          onSuccess={close}
        />
      )}
    </Modal>
  );
}
