"use client";

import { authService, User } from "@/lib/auth-service";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: (isExpired?: boolean | unknown) => void;
  checkAuth: () => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasRole: (...roles: string[]) => boolean;
  canModify: (
    resourceOwnerId?: string | null,
    allowedRoles?: string[],
  ) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getUser());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(
    async (isExpired?: boolean | unknown) => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {}
      authService.clearSession();
      setUser(null);
      if (isExpired === true) {
        router.push("/login?expired=1");
      } else {
        router.push("/login");
      }
    },
    [router],
  );

  const checkAuth = useCallback(() => {
    if (!user && !authService.getUser()) {
      logout(true);
      return false;
    }
    return true;
  }, [user, logout]);

  useEffect(() => {
    let isMounted = true;

    const verifyDatabaseSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.user && isMounted) {
            setUser(data.user);
            authService.setSession(data.user);
          }
        } else if (res.status === 401) {
          if (isMounted) {
            authService.clearSession();
            setUser(null);
          }
        }
      } catch {
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyDatabaseSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    (accessToken: string, refreshToken: string, userData: User) => {
      authService.setSession(userData, accessToken, refreshToken);
      setUser(userData);
      setLoading(false);
    },
    [],
  );

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasRole = (...roles: string[]) =>
    !!user?.role && roles.includes(user.role);

  const canModify = useCallback(
    (resourceOwnerId?: string | null, allowedRoles: string[] = []) => {
      if (!user) return false;
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return true;
      if (allowedRoles.length > 0 && allowedRoles.includes(user.role))
        return true;
      if (resourceOwnerId && user.id === resourceOwnerId) return true;
      return false;
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkAuth,
        isAdmin,
        isSuperAdmin,
        hasRole,
        canModify,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
