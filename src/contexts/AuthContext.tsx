"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { hasValidSessionCookie, clearSessionCookie } from "@/lib/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  registerUser: (
    firstname: string,
    lastname: string,
    email: string,
    password: string,
    options?: { autoLogin?: boolean }
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

type SafeUser = {
  id?: string | number;
  email?: string;
  username?: string;
  roles?: string[] | string;
  avatar?: string;
  type?: "user" | "guest";
};

const USER_STORAGE_KEY = "auth_user";

const toSafeUser = (raw: any, type: SafeUser["type"] = "user"): SafeUser => ({
  id: raw?.id ?? raw?._id,
  email: raw?.email,
  username: raw?.username ?? raw?.name,
  roles: raw?.roles ?? raw?.role,
  avatar: raw?.avatar ?? raw?.image,
  type,
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SafeUser | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const loadUserFromStorage = (): SafeUser | null => {
    if (typeof window === "undefined") return null;
    try {
      const json = localStorage.getItem(USER_STORAGE_KEY);
      return json ? (JSON.parse(json) as SafeUser) : null;
    } catch {
      return null;
    }
  };

  const saveUserToStorage = (u: SafeUser | null) => {
    if (typeof window === "undefined") return;
    try {
      if (!u) localStorage.removeItem(USER_STORAGE_KEY);
      else localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
    } catch {
      // no-op
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;

      if (token) {
        const stored = loadUserFromStorage();
        setIsAuthenticated(true);
        setIsGuest(stored?.type === "guest");
        setUser(stored ?? null);
        setIsLoading(false);
        return;
      }

      // Guest session cookie flow
      if (!hasValidSessionCookie()) {
        setIsAuthenticated(false);
        setIsGuest(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API}/guest/protected-resource`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const safe = toSafeUser(data, "guest");
        setIsAuthenticated(true);
        setIsGuest(true);
        setUser(safe);
        saveUserToStorage(safe);
      } else {
        setIsAuthenticated(false);
        setIsGuest(false);
        setUser(null);
        clearSessionCookie();
        saveUserToStorage(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setIsGuest(false);
      setUser(null);
      saveUserToStorage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async () => {
    try {
      const response = await fetch(`${API}/guest/create-anonymous-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to create guest session");

      const data = await response.json();
      const safe = toSafeUser(data, "guest");

      setIsAuthenticated(true);
      setIsGuest(true);
      setUser(safe);
      saveUserToStorage(safe);
    } catch (error) {
      console.error("Error creating guest session:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const resp = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!resp.ok) {
        let message = "Invalid credentials";
        try {
          const errData = await resp.json();
          message = errData?.message || message;
        } catch {}
        throw new Error(message);
      }

      const data = await resp.json();

      if (data?.access_token && typeof window !== "undefined") {
        localStorage.setItem("access_token", data.access_token);
        // Set cookie with more explicit settings to ensure it's properly set
        document.cookie = `access_token=${data.access_token}; Path=/; Max-Age=${
          60 * 60 * 24
        }; SameSite=Lax${
          window.location.protocol === "https:" ? "; Secure" : ""
        }`;
      }

      if (data?.user) {
        const safe = toSafeUser(data.user, "user");
        setIsAuthenticated(true);
        setIsGuest(false);
        setUser(safe);
        saveUserToStorage(safe);
        return;
      }

      await checkAuthStatus();
    } catch (error) {
      throw error;
    }
  };

  const registerUser = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    options?: { autoLogin?: boolean }
  ) => {
    try {
      const resp = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      if (!resp.ok) {
        let message = "Registration failed";
        try {
          const errData = await resp.json();
          message =
            errData?.message ||
            errData?.error ||
            errData?.errors?.[0]?.message ||
            message;
        } catch {}
        throw new Error(message);
      }

      if (options?.autoLogin) {
        await login(email, password);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      document.cookie = "access_token=; Path=/; Max-Age=0; SameSite=Lax";
      clearSessionCookie();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsAuthenticated(false);
      setIsGuest(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isGuest,
    isLoading,
    user,
    login,
    loginAsGuest,
    logout,
    checkAuthStatus,
    registerUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
