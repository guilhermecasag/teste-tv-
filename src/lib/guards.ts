import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Acesso restrito ao administrador.");
  }
  return session;
}

export async function requireSession() {
  const session = await auth();
  if (!session) {
    throw new Error("É necessário estar autenticado.");
  }
  return session;
}
