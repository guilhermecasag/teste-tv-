"use client";

import { useActionState, useTransition } from "react";
import {
  updateObservationAction,
  uploadPhotoAction,
  deletePhotoAction,
  createIssueAction,
  resolveIssueAction,
  type ObservationFormState,
  type PhotoFormState,
  type IssueFormState,
} from "@/actions/equipment";

type Option = { id: string; name: string };

type Photo = {
  id: string;
  url: string;
  category: "INICIO" | "ANDAMENTO" | "CONCLUIDO" | "PROBLEMA" | "GERAL";
  uploadedBy: { name: string } | null;
};

type Issue = {
  id: string;
  description: string;
  status: "ABERTA" | "RESOLVIDA";
  responsible: { name: string } | null;
};

type Equipment = {
  id: string;
  name: string;
  observation: string | null;
  photos: Photo[];
  issues: Issue[];
};

const CATEGORY_LABEL: Record<Photo["category"], string> = {
  INICIO: "Início",
  ANDAMENTO: "Andamento",
  CONCLUIDO: "Concluído",
  PROBLEMA: "Problema",
  GERAL: "Geral",
};

function ObservationSection({ tripId, equipment }: { tripId: string; equipment: Equipment }) {
  const initial: ObservationFormState = { error: null };
  const [state, formAction, pending] = useActionState(
    updateObservationAction.bind(null, equipment.id, tripId),
    initial
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <textarea
        name="observation"
        defaultValue={equipment.observation ?? ""}
        className="field-input"
        rows={3}
        placeholder="Ex: Montagem concluída. Aguardando teste final."
      />
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Salvando..." : "Salvar observação"}
      </button>
    </form>
  );
}

function PhotosSection({
  tripId,
  equipment,
  canDelete,
}: {
  tripId: string;
  equipment: Equipment;
  canDelete: boolean;
}) {
  const initial: PhotoFormState = { error: null };
  const [state, formAction, pending] = useActionState(
    uploadPhotoAction.bind(null, equipment.id, tripId),
    initial
  );
  const [deleting, startDelete] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Categoria</label>
          <select name="category" defaultValue="GERAL" className="field-input">
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Foto</label>
          <input
            name="file"
            type="file"
            accept="image/*"
            capture="environment"
            required
            className="text-sm"
          />
        </div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Enviando..." : "Enviar foto"}
        </button>
      </form>
      {state.error && <p className="form-error">{state.error}</p>}

      {equipment.photos.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma foto registrada ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {equipment.photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={CATEGORY_LABEL[photo.category]} className="h-28 w-full object-cover" />
              <span className="absolute left-1 top-1 badge bg-black/60 text-white">
                {CATEGORY_LABEL[photo.category]}
              </span>
              {canDelete && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => startDelete(() => deletePhotoAction(photo.id, tripId))}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IssuesSection({
  tripId,
  equipment,
  montadores,
}: {
  tripId: string;
  equipment: Equipment;
  montadores: Option[];
}) {
  const initial: IssueFormState = { error: null };
  const [state, formAction, pending] = useActionState(
    createIssueAction.bind(null, equipment.id, tripId),
    initial
  );
  const [resolving, startResolve] = useTransition();

  const open = equipment.issues.filter((i) => i.status === "ABERTA");
  const resolved = equipment.issues.filter((i) => i.status === "RESOLVIDA");

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="field-label">Nova pendência</label>
          <input name="description" required className="field-input" placeholder="Falta peça X para concluir." />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Responsável</label>
          <select name="responsibleId" className="field-input">
            <option value="">Não definido</option>
            {montadores.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "..." : "Adicionar"}
        </button>
      </form>
      {state.error && <p className="form-error">{state.error}</p>}

      {open.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma pendência aberta.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {open.map((issue) => (
            <li
              key={issue.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-status-bloqueado/30 bg-status-bloqueado/5 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">⚠️ {issue.description}</p>
                <p className="text-xs text-muted">{issue.responsible?.name ?? "Sem responsável"}</p>
              </div>
              <button
                type="button"
                disabled={resolving}
                className="btn-secondary py-1.5 text-xs"
                onClick={() => startResolve(() => resolveIssueAction(issue.id, tripId))}
              >
                Marcar resolvida
              </button>
            </li>
          ))}
        </ul>
      )}

      {resolved.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs text-muted">
            {resolved.length} pendência(s) resolvida(s)
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {resolved.map((issue) => (
              <li key={issue.id} className="text-sm text-muted">
                ✓ {issue.description}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function EquipmentDetailModalBody({
  tripId,
  equipment,
  montadores,
  canManage = true,
}: {
  tripId: string;
  equipment: Equipment;
  montadores: Option[];
  canManage?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-foreground">Observação</p>
        <ObservationSection tripId={tripId} equipment={equipment} />
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-foreground">Fotos</p>
        <PhotosSection tripId={tripId} equipment={equipment} canDelete={canManage} />
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-foreground">Pendências</p>
        <IssuesSection tripId={tripId} equipment={equipment} montadores={montadores} />
      </div>
    </div>
  );
}
