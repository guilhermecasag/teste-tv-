"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

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
  await requireAdmin();

  const parsed = equipmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.equipment.create({
    data: {
      tripId,
      name: parsed.data.name,
      code: parsed.data.code || null,
      description: parsed.data.description || null,
      weight: parsed.data.weight ?? 1,
      responsibleId: parsed.data.responsibleId || null,
    },
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
  await requireAdmin();
  const parsedStatus = statusEnum.parse(status);

  await prisma.equipment.update({
    where: { id: equipmentId },
    data: {
      status: parsedStatus,
      startedAt: parsedStatus === "EM_ANDAMENTO" ? new Date() : undefined,
      completedAt: parsedStatus === "CONCLUIDO" ? new Date() : null,
    },
  });

  revalidatePath(`/admin/viagens/${tripId}`);
  revalidatePath("/admin/equipamentos");
}
