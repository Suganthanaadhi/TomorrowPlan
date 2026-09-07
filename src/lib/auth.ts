import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUserByCredentials } from "./mock-users";

// TEMPORARY: backed by the in-memory mock-users store (src/lib/mock-users.ts)
// so registration/login work end-to-end before the database is wired up.
// Replace `findUserByCredentials` with a Prisma + bcryptjs lookup once that's
// ready — nothing else in the app needs to change.

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (typeof credentials?.username !== "string" || typeof credentials?.password !== "string") {
          return null;
        }
        const user = findUserByCredentials(credentials.username, credentials.password);
        if (!user) return null;
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          timezone: user.timezone,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.timezone = user.timezone;
      }
      if (trigger === "update" && session?.timezone) {
        token.timezone = session.timezone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.timezone = token.timezone as string;
      }
      return session;
    },
  },
});
