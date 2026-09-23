import { prisma } from "@/lib/prisma";
import type { TimelineEventType } from "@prisma/client";

export async function addTimelineEvent(params: {
  tripId: string;
  equipmentId?: string;
  userId?: string;
  type: TimelineEventType;
  message: string;
}) {
  await prisma.timelineEvent.create({
    data: {
      tripId: params.tripId,
      equipmentId: params.equipmentId,
      userId: params.userId,
      type: params.type,
      message: params.message,
    },
  });
}
