"use client";

import { useTransition } from "react";
import {
  updateEquipmentStatusAction,
  deleteEquipmentAction,
} from "@/actions/equipment";
import { Modal } from "@/components/modal";
import { EquipmentDetailModalBody } from "./equipment-detail-modal";

type Option = { id: string; name: string };

type Equipment = {
  id: string;
  name: string;
  code: string | null;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO" | "BLOQUEADO";
  weight: number;
  responsible: { name: string } | null;
  observation: string | null;
  photos: {
    id: string;
    url: string;
    category: "INICIO" | "ANDAMENTO" | "CONCLUIDO" | "PROBLEMA" | "GERAL";
    uploadedBy: { name: string } | null;
  }[];
  issues: {
    id: string;
    description: string;
    status: "ABERTA" | "RESOLVIDA";
    responsible: { name: string } | null;
  }[];
};

const STATUS_META: Record<
  Equipment["status"],
  { label: string; icon: string; className: string }
> = {
  CONCLUIDO: { label: "Concluído", icon: "✓", className: "bg-brand-primary-light text-brand-primary" },
  EM_ANDAMENTO: { label: "Em andamento", icon: "🔧", className: "bg-status-andamento/10 text-status-andamento" },
  BLOQUEADO: { label: "Bloqueado", icon: "⚠️", className: "bg-status-bloqueado/10 text-status-bloqueado" },
  PENDENTE: { label: "Pendente", icon: "○", className: "bg-status-pendente/10 text-status-pendente" },
};

const STATUS_CYCLE: Equipment["status"][] = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "BLOQUEADO",
];

export function EquipmentList({
  tripId,
  equipment,
  progressMethod,
  montadores,
}: {
  tripId: string;
  equipment: Equipment[];
  progressMethod: string;
  montadores: Option[];
}) {
  const [pending, startTransition] = useTransition();

  const totalWeight = equipment.reduce((sum, e) => sum + (progressMethod === "PONDERADO" ? e.weight : 1), 0);
  const doneWeight = equipment
    .filter((e) => e.status === "CONCLUIDO")
    .reduce((sum, e) => sum + (progressMethod === "PONDERADO" ? e.weight : 1), 0);
  const percent = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;

  const counts = equipment.reduce(
    (acc, e) => {
      acc[e.status]++;
      return acc;
    },
    { PENDENTE: 0, EM_ANDAMENTO: 0, CONCLUIDO: 0, BLOQUEADO: 0 } as Record<Equipment["status"], number>
  );

  return (
    <div className="flex flex-col gap-4">
      {equipment.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">{percent}% concluído</span>
            <span className="text-muted">
              {counts.CONCLUIDO} de {equipment.length} equipamentos
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            <span>✓ {counts.CONCLUIDO} concluídos</span>
            <span>🔧 {counts.EM_ANDAMENTO} em andamento</span>
            <span>⚠️ {counts.BLOQUEADO} bloqueados</span>
            <span>○ {counts.PENDENTE} pendentes</span>
          </div>
        </div>
      )}

      {equipment.length === 0 ? (
        <p className="text-sm text-muted">Nenhum equipamento cadastrado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {equipment.map((eq) => {
            const meta = STATUS_META[eq.status];
            const openIssues = eq.issues.filter((i) => i.status === "ABERTA").length;
            return (
              <li
                key={eq.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <Modal
                  title={eq.name}
                  trigger={
                    <button type="button" className="text-left">
                      <p className="text-sm font-medium text-foreground hover:text-brand-primary">
                        {meta.icon} {eq.name}
                        {eq.code && <span className="text-muted"> · {eq.code}</span>}
                      </p>
                      <p className="text-xs text-muted">
                        {eq.responsible?.name ?? "Sem responsável"}
                        {progressMethod === "PONDERADO" && ` · peso ${eq.weight}`}
                        {eq.photos.length > 0 && ` · 📷 ${eq.photos.length}`}
                        {openIssues > 0 && ` · ⚠️ ${openIssues}`}
                      </p>
                    </button>
                  }
                >
                  {() => (
                    <EquipmentDetailModalBody tripId={tripId} equipment={eq} montadores={montadores} />
                  )}
                </Modal>

                <div className="flex items-center gap-2">
                  <span className={`badge ${meta.className}`}>{meta.label}</span>

                  <select
                    disabled={pending}
                    value={eq.status}
                    onChange={(e) => {
                      const status = e.target.value as Equipment["status"];
                      startTransition(() => {
                        updateEquipmentStatusAction(eq.id, tripId, status);
                      });
                    }}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                  >
                    {STATUS_CYCLE.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={pending}
                    className="btn-danger"
                    onClick={() => {
                      if (!confirm(`Excluir "${eq.name}"?`)) return;
                      startTransition(() => {
                        deleteEquipmentAction(eq.id, tripId);
                      });
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
