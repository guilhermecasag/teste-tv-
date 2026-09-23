import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subscribe, userChannel, tripChannel } from "@/lib/realtime";

export const dynamic = "force-dynamic";

/**
 * SSE: o cliente abre uma conexao e recebe eventos conforme acontecem,
 * sem precisar dar F5 (secoes 22/23 do briefing). Sempre inscreve o
 * canal do proprio usuario (para o sino de notificacoes); opcionalmente
 * tambem o canal de uma viagem especifica (?tripId=...), se o usuario
 * tiver acesso a ela.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tripId = req.nextUrl.searchParams.get("tripId");
  const channels = [userChannel(session.user.id)];

  if (tripId) {
    let allowed = session.user.role === "ADMIN";
    if (!allowed && session.user.role === "MONTADOR") {
      allowed = !!(await prisma.tripUser.findUnique({
        where: { tripId_userId: { tripId, userId: session.user.id } },
      }));
    }
    if (!allowed && session.user.role === "ESPECTADOR") {
      allowed = !!(await prisma.tripViewer.findUnique({
        where: { tripId_userId: { tripId, userId: session.user.id } },
      }));
    }
    if (allowed) channels.push(tripChannel(tripId));
  }

  const encoder = new TextEncoder();
  let unsubscribers: (() => void)[] = [];
  let keepAlive: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      unsubscribers = channels.map((channel) =>
        subscribe(channel, (data) => send("update", data))
      );

      send("ready", { channels });
      keepAlive = setInterval(() => controller.enqueue(encoder.encode(": ping\n\n")), 25000);
    },
    cancel() {
      unsubscribers.forEach((unsub) => unsub());
      clearInterval(keepAlive);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
