import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (!res.ok) {
            return null;
          }

          const data = await res.json();
          if (!data.access_token) return null;

          return {
            id: credentials.email,
            name: credentials.email.split("@")[0],
            email: credentials.email,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          };
        } catch (err) {
          console.error("Error en authorize() credentials", err);
          return null;
        }
      },
    }),

    CredentialsProvider({
      id: "backend-token",
      name: "Backend Token",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        console.log("backend-token authorize() credentials:", credentials);

        if (!credentials?.token) {
          console.error("No viene token en credentials");
          return null;
        }

        return {
          id: "google-user",
          name: "Google User",
          email: "google-user@example.com",
          accessToken: credentials.token,
          refreshToken: null,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if ((user as any).accessToken) {
          token.accessToken = (user as any).accessToken;
        }
        if ((user as any).refreshToken) {
          token.refreshToken = (user as any).refreshToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).refreshToken = token.refreshToken;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};
