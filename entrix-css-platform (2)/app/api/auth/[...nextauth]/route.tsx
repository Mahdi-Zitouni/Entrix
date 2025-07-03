import NextAuth from "next-auth"
// @ts-ignore: type definitions for credentials provider may be missing in v5 beta
import Credentials from "next-auth/providers/credentials"

// @ts-expect-error: NextAuth default export is a route handler, not a callable function in v5+
const handler = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch((process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL) + "/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: data.user.id,
            email: data.user.email,
            roles: data.user.roles,
            accessToken: data.access_token,
            ...data.user,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.roles = user.roles;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.roles = token.roles;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "your-secret-key-change-in-production",
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
