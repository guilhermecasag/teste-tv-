"use server";

import { z } from "zod";
import { unlink } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireTripMember } from "@/lib/guards";
import { addTimelineEvent } from "@/lib/timeline";
import { saveEquipmentPhoto } from "@/lib/storage";

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  BLOQUEADO: "Bloqueado",
};

const CATEGORY_LABEL: Record<string, string> = {
  INICIO: "início",
  ANDAMENTO: "andamento",
  CONCLUIDO: "conclusão",
  PROBLEMA: "problema",
  GERAL: "geral",
};

const equipmentSchema = z.object({
  name: z.string().min(1, "Informe o nome do equipamento."),
  code: z.string().optional(),
  description: z.string().optional(),
  weight: z.coerce.number().positive().optional(),
  responsibleId: z.string().optional(),
});

export type EquipmentFormState = { error: string | null };

export async function createEquipmentAction(
  tripId: string,
  _prev: EquipmentFormState,
  formData: FormData
): Promise<EquipmentFormState> {
  const session = await requireAdmin();

  const parsed = equipmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const equipment = await prisma.equipment.create({
    data: {
      tripId,
      name: parsed.data.name,
      code: parsed.data.code || null,
      description: parsed.data.description || null,
      weight: parsed.data.weight ?? 1,
      responsibleId: parsed.data.responsibleId || null,
    },
  });

  await addTimelineEvent({
    tripId,
    equipmentId: equipment.id,
    userId: session.user.id,
    type: "EQUIPAMENTO_STATUS",
    message: `Equipamento "${equipment.name}" cadastrado.`,
  });

  revalidatePath(`/admin/viagens/${tripId}`);
  revalidatePath("/admin/equipamentos");
  return { error: null };
}

export async function deleteEquipmentAction(equipmentId: string, tripId: string) {
  await requireAdmin();
  await prisma.equipment.delete({ where: { id: equipmentId } });
  revalidatePath(`/admin/viagens/${tripId}`);
  revalidatePath("/admin/equipamentos");
}

const statusEnum = z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO", "BLOQUEADO"]);

export async function updateEquipmentStatusAction(
  equipmentId: string,
  tripId: string,
  status: z.infer<typeof statusEnum>
) {
  const session = await requireTripMember(tripId);
  const parsedStatus = statusEnum.parse(status);

  const equipment = await prisma.equipment.update({
    where: { id: equipmentId },
    data: {
      status: parsedStatus,
      startedAt: parsedStatus === "EM_ANDAMENTO" ? new Date() : undefined,
      completedAt: parsedStatus === "CONCLUIDO" ? new Date() : null,
    },
  });

  await addTimelineEvent({
    tripId,
    equipmentId,
    userId: session.user.id,
    type: "EQUIPAMENTO_STATUS",
    message: `${equipment.name}: status alterado para ${STATUS_LABEL[parsedStatus]}.`,
  });

  revalidatePath(`/admin/viagens/${tripId}`);
  revalidatePath("/admin/equipamentos");
  revalidatePath("/app");
  revalidatePath("/app/montagem");
}

const observationSchema = z.object({ observation: z.string().optional() });

export type ObservationFormState = { error: string | null };

export async function updateObservationAction(
  equipmentId: string,
  tripId: string,
  _prev: ObservationFormState,
  formData: FormData
): Promise<ObservationFormState> {
  const session = await requireTripMember(tripId);

  const parsed = observationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Observação inválida." };
  }

  const equipment = await prisma.equipment.update({
    where: { id: equipmentId },
    data: { observation: parsed.data.observation || null },
  });

  await addTimelineEvent({
    tripId,
    equipmentId,
    userId: session.user.id,
    type: "EQUIPAMENTO_OBSERVACAO",
    message: `${equipment.name}: observação atualizada.`,
  });

  revalidatePath(`/admin/viagens/${tripId}`);
  revalidatePath("/app/montagem");
  return { error: null };
}

export type PhotoFormState = { error: string | null };

const photoCategoryEnum = z.enum(["INICIO", "ANDAMENTO", "CONCLUIDO", "PROBLEMA", "GERAL"]);

export async function uploadPhotoAction(
  equipmentId: string,
  tripId: string,
  _prev: PhotoFormState,
  formData: FormData
): Promise<PhotoFormState> {
  const session = await requireTripMember(tripId);

  const file = formData.get("file");
  const category = photoCategoryEnum.safeParse(formData.get("category"));

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma foto." };
  }
  if (!category.success) {
    return { error: "Categoria inválida." };
  }

  let url: string;
  try {
    url = await saveEquipmentPhoto(tripId, equipmentId, file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Falha ao enviar a foto." };
  }

  const equipment = await prisma.equipment.findUniqueOrThrow({ where: { id: equipmentId } });

  await prisma.equipmentPhoto.create({
    data: {
      equipmentId,
      url,
      category: category.data,
      uploadedById: session.user.id,
    },
  });

  await addTimelineEvent({
    tripId,
    equipmentId,
    userId: session.user.id,
    type: "EQUIPAMENTO_FOTO",
    message: `${equipment.name}: foto de ${CATEGORY_LABEL[category.data]} adicionada.`,
  });

  revalidatePath(`/admin/viagens/${tripId}`);
  revalidatePath("/app/montagem");
  return { error: null };
}

export async function deletePhotoAction(photoId: string, tripId: string) {
  await requireAdmin();

  const photo = await prisma.equipmentPhoto.findUniqueOrThrow({ where: { id: photoId } });
  await prisma.equipmentPhoto.delete({ where: { id: photoId } });

  if (photo.url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", photo.url);
    await unlink(filePath).catch(() => {});
  }

  revalidatePath(`/admin/viagens/${tripId}`);
}

const issueSchema = z.object({
  description: z.string().min(2, "Descreva a pendência."),
  responsibleId: z.string().optional(),
});

export type IssueFormState = { error: string | null };

export async function createIssueAction(
  equipmentId: string,
  tripId: string,
  _prev: IssueFormState,
  formData: FormData
): Promise<IssueFormState> {
  const session = await requireTripMember(tripId);

  const parsed = issueSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const equipment = await prisma.equipment.findUniqueOrThrow({ where: { id: equipmentId } });

  await prisma.equipmentIssue.create({
    data: {
      equipmentId,
      description: parsed.data.description,
      responsibleId: parsed.data.responsibleId || null,
    },
  });

  await addTimelineEvent({
    tripId,
    equipmentId,
    userId: session.user.id,
    type: "PENDENCIA_ABERTA",
    message: `${equipment.name}: pendência aberta — ${parsed.data.description}`,
  });

  revalidatePath(`/admin/viagens/${tripId}`);
  revalidatePath("/app/montagem");
  return { error: null };
}

export async function resolveIssueAction(issueId: string, tripId: string) {
  const session = await requireTripMember(tripId);

  const issue = await prisma.equipmentIssue.update({
    where: { id: issueId },
    data: { status: "RESOLVIDA", resolvedAt: new Date() },
    include: { equipment: true },
  });

  await addTimelineEvent({
    tripId,
    equipmentId: issue.equipmentId,
    userId: session.user.id,
    type: "PENDENCIA_RESOLVIDA",
    message: `${issue.equipment.name}: pendência resolvida — ${issue.description}`,
  });

  revalidatePath(`/admin/viagens/${tripId}`);
  revalidatePath("/app/montagem");
}
