import type { NextAuthConfig } from "next-auth";

/**
 * Config sem providers/DB, usada pelo middleware (Edge Runtime).
 * O config completo (com Credentials + bcrypt + Prisma) fica em auth.ts,
 * usado apenas nos route handlers e server components (Node runtime).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  // Em producao, o NextAuth v5 valida o header Host contra AUTH_URL/
  // NEXTAUTH_URL por padrao e recusa qualquer coisa fora disso (erro
  // "UntrustedHost"). Como este app roda atras do dominio configurado em
  // NEXTAUTH_URL (nunca aceitando header Host arbitrario de outro lugar),
  // confiar nele aqui e seguro.
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "MONTADOR" | "ESPECTADOR";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
