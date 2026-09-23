import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  MONTADOR: "/app",
  ESPECTADOR: "/espectador",
};

export default async function RootPage() {
  const session = await auth();

  if (!session) redirect("/login");

  redirect(ROLE_HOME[session.user.role] ?? "/login");
}
