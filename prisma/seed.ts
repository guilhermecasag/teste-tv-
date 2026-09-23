import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MONTADOR" | "ESPECTADOR";
  phone?: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone,
    },
  });
  console.log(`✓ ${data.role} pronto: ${user.email} / senha: ${data.password}`);
}

async function main() {
  await upsertUser({
    name: "Administrador LTM",
    email: "admin@ltmautomacao.com",
    password: "admin123",
    role: "ADMIN",
  });

  await upsertUser({
    name: "João Montador",
    email: "joao@ltmautomacao.com",
    password: "montador123",
    role: "MONTADOR",
    phone: "(88) 99999-0001",
  });

  await upsertUser({
    name: "Gestor Espectador",
    email: "gestor@ltmautomacao.com",
    password: "gestor123",
    role: "ESPECTADOR",
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
