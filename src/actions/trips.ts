"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { addTimelineEvent } from "@/lib/timeline";

const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada",
  EM_DESLOCAMENTO: "Em deslocamento",
  EM_MONTAGEM: "Em montagem",
  PAUSADA: "Pausada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const tripStatusEnum = z.enum([
  "PLANEJADA",
  "EM_DESLOCAMENTO",
  "EM_MONTAGEM",
  "PAUSADA",
  "CONCLUIDA",
  "CANCELADA",
]);
const progressMethodEnum = z.enum(["IGUAL", "PONDERADO"]);

const tripSchema = z
  .object({
    clientId: z.string().min(1, "Selecione o cliente."),
    address: z.string().optional(),
    city: z.string().min(1, "Informe a cidade."),
    state: z.string().min(2, "Informe o estado."),
    startDate: z.string().min(1, "Informe a data de início."),
    endDate: z.string().min(1, "Informe a data de fim."),
    status: tripStatusEnum,
    progressMethod: progressMethodEnum,
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "A data de fim não pode ser antes da data de início.",
    path: ["endDate"],
  });

export type TripFormState = { error: string | null; tripId?: string };

function parseMembers(formData: FormData) {
  return formData.getAll("memberIds").map(String).filter(Boolean);
}

function parseViewers(formData: FormData) {
  return formData.getAll("viewerIds").map(String).filter(Boolean);
}

export async function createTripAction(
  _prev: TripFormState,
  formData: FormData
): Promise<TripFormState> {
  const session = await requireAdmin();

  const parsed = tripSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const memberIds = parseMembers(formData);
  const viewerIds = parseViewers(formData);

  const trip = await prisma.trip.create({
    data: {
      clientId: parsed.data.clientId,
      address: parsed.data.address || null,
      city: parsed.data.city,
      state: parsed.data.state.toUpperCase(),
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      status: parsed.data.status,
      progressMethod: parsed.data.progressMethod,
      notes: parsed.data.notes || null,
      members: { create: memberIds.map((userId) => ({ userId })) },
      viewers: { create: viewerIds.map((userId) => ({ userId })) },
      travelInfo: { create: {} },
    },
  });

  await addTimelineEvent({
    tripId: trip.id,
    userId: session.user.id,
    type: "VIAGEM_STATUS",
    message: `Viagem criada — status inicial: ${STATUS_LABEL[trip.status]}.`,
  });

  revalidatePath("/admin/viagens");
  return { error: null, tripId: trip.id };
}

export async function updateTripAction(
  tripId: string,
  _prev: TripFormState,
  formData: FormData
): Promise<TripFormState> {
  const session = await requireAdmin();

  const parsed = tripSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const memberIds = parseMembers(formData);
  const viewerIds = parseViewers(formData);

  const before = await prisma.trip.findUniqueOrThrow({ where: { id: tripId } });

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: {
        clientId: parsed.data.clientId,
        address: parsed.data.address || null,
        city: parsed.data.city,
        state: parsed.data.state.toUpperCase(),
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        status: parsed.data.status,
        progressMethod: parsed.data.progressMethod,
        notes: parsed.data.notes || null,
      },
    }),
    prisma.tripUser.deleteMany({ where: { tripId } }),
    prisma.tripUser.createMany({
      data: memberIds.map((userId) => ({ tripId, userId })),
    }),
    prisma.tripViewer.deleteMany({ where: { tripId } }),
    prisma.tripViewer.createMany({
      data: viewerIds.map((userId) => ({ tripId, userId })),
    }),
  ]);

  if (before.status !== parsed.data.status) {
    await addTimelineEvent({
      tripId,
      userId: session.user.id,
      type: "VIAGEM_STATUS",
      message: `Status da viagem alterado para ${STATUS_LABEL[parsed.data.status]}.`,
    });
  }

  revalidatePath("/admin/viagens");
  revalidatePath(`/admin/viagens/${tripId}`);
  return { error: null, tripId };
}

const travelInfoSchema = z.object({
  flightInfo: z.string().optional(),
  transportInfo: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  hotelName: z.string().optional(),
  hotelAddress: z.string().optional(),
  hotelPhone: z.string().optional(),
  hotelCheckIn: z.string().optional(),
  hotelCheckOut: z.string().optional(),
  notes: z.string().optional(),
});

export type TravelInfoFormState = { error: string | null };

export async function updateTravelInfoAction(
  tripId: string,
  _prev: TravelInfoFormState,
  formData: FormData
): Promise<TravelInfoFormState> {
  await requireAdmin();

  const parsed = travelInfoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const d = parsed.data;
  await prisma.tripTravelInfo.upsert({
    where: { tripId },
    create: {
      tripId,
      flightInfo: d.flightInfo || null,
      transportInfo: d.transportInfo || null,
      driverName: d.driverName || null,
      driverPhone: d.driverPhone || null,
      hotelName: d.hotelName || null,
      hotelAddress: d.hotelAddress || null,
      hotelPhone: d.hotelPhone || null,
      hotelCheckIn: d.hotelCheckIn ? new Date(d.hotelCheckIn) : null,
      hotelCheckOut: d.hotelCheckOut ? new Date(d.hotelCheckOut) : null,
      notes: d.notes || null,
    },
    update: {
      flightInfo: d.flightInfo || null,
      transportInfo: d.transportInfo || null,
      driverName: d.driverName || null,
      driverPhone: d.driverPhone || null,
      hotelName: d.hotelName || null,
      hotelAddress: d.hotelAddress || null,
      hotelPhone: d.hotelPhone || null,
      hotelCheckIn: d.hotelCheckIn ? new Date(d.hotelCheckIn) : null,
      hotelCheckOut: d.hotelCheckOut ? new Date(d.hotelCheckOut) : null,
      notes: d.notes || null,
    },
  });

  revalidatePath(`/admin/viagens/${tripId}`);
  return { error: null };
}
