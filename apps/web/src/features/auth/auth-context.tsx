"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type User = {
  id: number;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function extractLoginPayload(payload: unknown): { accessToken: string; user?: User } {
  const value = payload as { accessToken?: string; token?: string; user?: User };
  const accessToken = value.accessToken ?? value.token;
  if (!accessToken) throw new Error("Login response did not contain an access token");
  return { accessToken, user: value.user };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(localStorage.getItem("finflow_access_token"));
    const rawUser = localStorage.getItem("finflow_user");
    setUser(rawUser ? (JSON.parse(rawUser) as User) : null);
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      async login(email, password) {
        const payload = await apiFetch<unknown>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const result = extractLoginPayload(payload);
        localStorage.setItem("finflow_access_token", result.accessToken);
        if (result.user) localStorage.setItem("finflow_user", JSON.stringify(result.user));
        setToken(result.accessToken);
        setUser(result.user ?? null);
      },
      logout() {
        localStorage.removeItem("finflow_access_token");
        localStorage.removeItem("finflow_user");
        setToken(null);
        setUser(null);
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.token) router.replace("/login");
  }, [auth.loading, auth.token, router]);

  return auth;
}
