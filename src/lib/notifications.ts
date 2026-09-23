import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { publish, userChannel } from "@/lib/realtime";
import type { NotificationType } from "@prisma/client";

export type NotifyParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  tripId?: string;
};

/**
 * Cria a notificacao no banco (aparece no sino), publica no canal SSE do
 * usuario (badge atualiza sem F5) e tenta o Web Push (chega mesmo com o
 * app fechado, se o usuario tiver ativado). As tres coisas acontecem
 * juntas sempre que algo relevante muda - secoes 20-23 do briefing.
 */
export async function notify(params: NotifyParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      tripId: params.tripId,
    },
  });

  publish(userChannel(params.userId), { kind: "notification", id: notification.id });

  await sendPushToUser(params.userId, {
    title: params.title,
    body: params.message,
    url: params.tripId ? `/app/viagem` : undefined,
  });

  return notification;
}

export async function notifyMany(userIds: string[], params: Omit<NotifyParams, "userId">) {
  const uniqueIds = [...new Set(userIds)];
  await Promise.all(uniqueIds.map((userId) => notify({ ...params, userId })));
}

export async function getTripViewerIds(tripId: string) {
  const viewers = await prisma.tripViewer.findMany({ where: { tripId }, select: { userId: true } });
  return viewers.map((v) => v.userId);
}

export async function getTripMemberIds(tripId: string) {
  const members = await prisma.tripUser.findMany({ where: { tripId }, select: { userId: true } });
  return members.map((m) => m.userId);
}

export async function getAdminIds() {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } });
  return admins.map((a) => a.id);
}
