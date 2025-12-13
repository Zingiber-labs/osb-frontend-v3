import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            return null;
          }

          const data = await res.json();

          if (!data.access_token) return null;

          const accessToken = data.access_token as string;
          const refreshToken = data.refresh_token as string | null;

          const profileRes = await fetch(`${API_URL}/auth/profile`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!profileRes.ok) {
            return null;
          }

          const profile = await profileRes.json();


          return {
            id: String(profile.userId),
            name: profile.username ?? credentials.email.split("@")[0],
            email: profile.email ?? credentials.email,
            accessToken,
            refreshToken,

            backendUserId: profile.userId,
            username: profile.username,
            isGuest: profile.isGuest,
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
        if (!credentials?.token) {
          console.error("No viene token en credentials");
          return null;
        }

        const accessToken = credentials.token;

        try {
          const profileRes = await fetch(`${API_URL}/auth/profile`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!profileRes.ok) {
            return null;
          }

          const profile = await profileRes.json();

          return {
            id: String(profile.userId),
            name: profile.username ?? "User",
            email: profile.email ?? "no-email@example.com",
            accessToken,
            refreshToken: null,
            backendUserId: profile.userId,
            username: profile.username,
            isGuest: profile.isGuest,
          };
        } catch (err) {
          console.error("Error in backend-token authorize()", err);
          return null;
        }
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

        if ((user as any).backendUserId) {
          token.backendUserId = (user as any).backendUserId;
        }
        if ((user as any).username) {
          token.username = (user as any).username;
        }
        if ((user as any).isGuest !== undefined) {
          token.isGuest = (user as any).isGuest;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).refreshToken = token.refreshToken;

        (session.user as any).backendUserId = token.backendUserId;
        (session.user as any).username = token.username;
        (session.user as any).isGuest = token.isGuest;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};
