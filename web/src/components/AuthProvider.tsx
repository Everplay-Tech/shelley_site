"use client";

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface AuthUser {
  accountId: number;
  email: string;
  displayName: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestMagicLink: (
    email: string
  ) => Promise<{ ok: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth");
    const data = await res.json();
    if (data.authenticated) {
      return {
        accountId: data.accountId,
        email: data.email,
        displayName: data.displayName ?? null,
      };
    }
  } catch {
    /* auth check failed silently */
  }
  return null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUser()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();
      if (!data.ok) return { ok: false as const, error: data.error };
      const u = await fetchUser();
      setUser(u);
      return { ok: true as const };
    },
    []
  );

  const signup = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", email, password, displayName }),
      });
      const data = await res.json();
      if (!data.ok) return { ok: false as const, error: data.error };
      const u = await fetchUser();
      setUser(u);
      return { ok: true as const };
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setUser(null);
  }, []);

  const requestMagicLink = useCallback(async (email: string) => {
    const res = await fetch("/api/auth/magic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false as const, error: data.error };
    return { ok: true as const };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        requestMagicLink,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
