"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/guards";

const roleEnum = z.enum(["ADMIN", "MONTADOR", "ESPECTADOR"]);

const createUserSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
  role: roleEnum,
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  cargo: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  password: z.union([z.string().min(6), z.literal("")]).optional(),
  role: roleEnum,
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  cargo: z.string().optional(),
});

export type UserFormState = { error: string | null };

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário com este e-mail." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      role: parsed.data.role,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      cargo: parsed.data.cargo || null,
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/montadores");
  return { error: null };
}

export async function updateUserAction(
  userId: string,
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin();

  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    return { error: "Já existe um usuário com este e-mail." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      email,
      role: parsed.data.role,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      cargo: parsed.data.cargo || null,
      ...(parsed.data.password
        ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) }
        : {}),
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/montadores");
  return { error: null };
}

export async function toggleUserActiveAction(userId: string) {
  const session = await requireAdmin();
  if (session.user.id === userId) {
    throw new Error("Você não pode desativar sua própria conta.");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/montadores");
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    newPassword: z.string().min(6, "A nova senha precisa ter pelo menos 6 caracteres."),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A confirmação não corresponde à nova senha.",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormState = { error: string | null; success?: boolean };

export async function changeOwnPasswordAction(
  _prev: ChangePasswordFormState,
  formData: FormData
): Promise<ChangePasswordFormState> {
  const session = await requireSession();

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Senha atual incorreta." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { error: null, success: true };
}
