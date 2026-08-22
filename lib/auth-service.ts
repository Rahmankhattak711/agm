export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

export const authService = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("agm_access_token");
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("agm_refresh_token");
  },

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("agm_user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  setSession(user: User, accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("agm_user", JSON.stringify(user));
    localStorage.setItem("agm_access_token", accessToken);
    localStorage.setItem("agm_refresh_token", refreshToken);

    document.cookie = `agm_access_token=${encodeURIComponent(
      accessToken,
    )}; path=/; max-age=604800; SameSite=Lax`;
    if (user.role) {
      document.cookie = `agm_user_role=${encodeURIComponent(
        user.role,
      )}; path=/; max-age=604800; SameSite=Lax`;
    }
  },

  clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("agm_user");
    localStorage.removeItem("agm_access_token");
    localStorage.removeItem("agm_refresh_token");

    document.cookie = "agm_access_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "agm_user_role=; path=/; max-age=0; SameSite=Lax";
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};
