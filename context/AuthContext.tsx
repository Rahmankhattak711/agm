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
  canModify: (resourceOwnerId?: string | null, allowedRoles?: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(
    (isExpired?: boolean | unknown) => {
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
    if (!authService.isAuthenticated() || authService.isSessionExpired()) {
      logout(true);
      return false;
    }
    return true;
  }, [logout]);

  // Handle 24-hour expiration lifecycle
  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
    } else {
      if (authService.isSessionExpired()) {
        authService.clearSession();
      }
      setUser(null);
    }
    setLoading(false);
  }, []);

  // 24-Hour Timer & Focus Auto-Logout Handler
  useEffect(() => {
    if (!user) return;

    const checkExpiration = () => {
      if (authService.isSessionExpired()) {
        logout(true);
      }
    };

    const remainingMs = authService.getTimeUntilExpiry();
    if (remainingMs <= 0) {
      logout(true);
      return;
    }

    // Set auto-logout timeout for the remaining 24h duration
    const timeoutId = setTimeout(() => {
      logout(true);
    }, remainingMs);

    // Periodically check (every 60s) and check on window focus/tab resume
    const intervalId = setInterval(checkExpiration, 60000);
    window.addEventListener("focus", checkExpiration);
    document.addEventListener("visibilitychange", checkExpiration);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      window.removeEventListener("focus", checkExpiration);
      document.removeEventListener("visibilitychange", checkExpiration);
    };
  }, [user, logout]);

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
      if (allowedRoles.length > 0 && allowedRoles.includes(user.role)) return true;
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
