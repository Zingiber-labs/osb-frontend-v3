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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (token) {
        setIsAuthenticated(true);
        setIsGuest(false);
        setIsLoading(false);
        return;
      }

      // First check if we have a session cookie
      if (!hasValidSessionCookie()) {
        setIsAuthenticated(false);
        setIsGuest(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/guest/protected-resource`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setIsGuest(true);
        setUser({ type: "guest", ...data });
      } else {
        // If the session is invalid, clear it
        setIsAuthenticated(false);
        setIsGuest(false);
        setUser(null);
        clearSessionCookie();
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setIsGuest(false);
      setUser(null);
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
      setIsAuthenticated(true);
      setIsGuest(true);
      setUser({ type: "guest", ...data });
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
      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
        document.cookie = `access_token=${data.access_token}; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Lax`
      }

      if (data?.user) {
        setIsAuthenticated(true);
        setIsGuest(false);
        setUser({ type: "user", ...data.user });
        return;
      }

      await checkAuthStatus();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem("access_token");
    document.cookie = "access_token=; Path=/; Max-Age=0; SameSite=Lax";
    // Clear session cookies and reset state
    try {
      clearSessionCookie();
      setIsAuthenticated(false);
      setIsGuest(false);
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
