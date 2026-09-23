"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/guards";
import { notifyMany } from "@/lib/notifications";

export async function fetchNotificationsAction() {
  const session = await requireSession();

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationReadAction(id: string) {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
}

export async function markAllNotificationsReadAction() {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
}

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export async function savePushSubscriptionAction(input: unknown) {
  const session = await requireSession();
  const parsed = subscriptionSchema.parse(input);

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.endpoint },
    create: { userId: session.user.id, ...parsed },
    update: { userId: session.user.id, p256dh: parsed.p256dh, auth: parsed.auth },
  });
}

export async function removePushSubscriptionAction(endpoint: string) {
  await requireSession();
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

const broadcastSchema = z.object({
  target: z.enum(["todos", "viagem", "montador"]),
  tripId: z.string().optional(),
  userId: z.string().optional(),
  message: z.string().min(2, "Escreva uma mensagem."),
});

export type BroadcastFormState = { error: string | null };

export async function broadcastNotificationAction(
  _prev: BroadcastFormState,
  formData: FormData
): Promise<BroadcastFormState> {
  await requireAdmin();

  const parsed = broadcastSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { target, tripId, userId, message } = parsed.data;

  let recipientIds: string[] = [];
  if (target === "todos") {
    const montadores = await prisma.user.findMany({
      where: { role: "MONTADOR", active: true },
      select: { id: true },
    });
    recipientIds = montadores.map((m) => m.id);
  } else if (target === "viagem") {
    if (!tripId) return { error: "Selecione a viagem." };
    const members = await prisma.tripUser.findMany({ where: { tripId }, select: { userId: true } });
    recipientIds = members.map((m) => m.userId);
  } else if (target === "montador") {
    if (!userId) return { error: "Selecione o montador." };
    recipientIds = [userId];
  }

  if (recipientIds.length === 0) {
    return { error: "Nenhum destinatário encontrado para o envio." };
  }

  await notifyMany(recipientIds, {
    type: "MENSAGEM",
    title: "⚠️ Atenção",
    message,
    tripId,
  });

  revalidatePath("/admin");
  return { error: null };
}
