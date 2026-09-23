"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

const clientSchema = z.object({
  name: z.string().min(2, "Informe o nome do cliente."),
  cnpj: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormState = { error: string | null };

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const session = await requireAdmin();

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.client.create({
    data: { ...parsed.data, createdById: session.user.id },
  });

  revalidatePath("/admin/clientes");
  return { error: null };
}

export async function updateClientAction(
  clientId: string,
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  await requireAdmin();

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.client.update({ where: { id: clientId }, data: parsed.data });

  revalidatePath("/admin/clientes");
  return { error: null };
}

export async function deleteClientAction(clientId: string) {
  await requireAdmin();

  const tripCount = await prisma.trip.count({ where: { clientId } });
  if (tripCount > 0) {
    throw new Error(
      "Não é possível excluir um cliente com viagens cadastradas."
    );
  }

  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath("/admin/clientes");
}
