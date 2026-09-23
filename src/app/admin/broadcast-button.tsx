"use client";

import { Modal } from "@/components/modal";
import { BroadcastForm } from "./broadcast-form";

type Option = { id: string; name: string };

export function BroadcastButton({ trips, montadores }: { trips: Option[]; montadores: Option[] }) {
  return (
    <Modal title="Enviar notificação" trigger={<button className="btn-secondary">📢 Enviar aviso</button>}>
      {(close) => <BroadcastForm trips={trips} montadores={montadores} onSuccess={close} />}
    </Modal>
  );
}
