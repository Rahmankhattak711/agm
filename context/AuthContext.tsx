"use client";

import { authService, User } from "@/lib/auth-service";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  checkAuth: () => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = authService.getUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    authService.setSession(userData, accessToken, refreshToken);
    setUser(userData);
    setLoading(false);
  };

  const logout = () => {
    authService.clearSession();
    setUser(null);
    router.push("/login");
  };

  const checkAuth = () => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return false;
    }
    return true;
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasRole = (...roles: string[]) =>
    !!user?.role && roles.includes(user.role);

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
