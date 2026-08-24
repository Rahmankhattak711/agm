export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_MAX_AGE = 86400;

export const authService = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    if (this.isSessionExpired()) {
      this.clearSession();
      return null;
    }
    return localStorage.getItem("agm_access_token");
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    if (this.isSessionExpired()) {
      this.clearSession();
      return null;
    }
    return localStorage.getItem("agm_refresh_token");
  },

  getSessionExpiry(): number | null {
    if (typeof window === "undefined") return null;
    const expiryStr = localStorage.getItem("agm_session_expiry");
    if (!expiryStr) return null;
    const num = Number(expiryStr);
    return isNaN(num) ? null : num;
  },

  isSessionExpired(): boolean {
    if (typeof window === "undefined") return false;
    const expiry = this.getSessionExpiry();
    if (!expiry) {
      const token = localStorage.getItem("agm_access_token");
      return !token;
    }
    return Date.now() >= expiry;
  },

  getTimeUntilExpiry(): number {
    if (typeof window === "undefined") return 0;
    const expiry = this.getSessionExpiry();
    if (!expiry) return 0;
    const remaining = expiry - Date.now();
    return remaining > 0 ? remaining : 0;
  },

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    if (this.isSessionExpired()) {
      this.clearSession();
      return null;
    }
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
    const expiry = Date.now() + SESSION_DURATION_MS;

    localStorage.setItem("agm_user", JSON.stringify(user));
    localStorage.setItem("agm_access_token", accessToken);
    localStorage.setItem("agm_refresh_token", refreshToken);
    localStorage.setItem("agm_session_expiry", expiry.toString());

    document.cookie = `agm_access_token=${encodeURIComponent(
      accessToken,
    )}; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`;
    if (user.role) {
      document.cookie = `agm_user_role=${encodeURIComponent(
        user.role,
      )}; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  },

  clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("agm_user");
    localStorage.removeItem("agm_access_token");
    localStorage.removeItem("agm_refresh_token");
    localStorage.removeItem("agm_session_expiry");

    document.cookie = "agm_access_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "agm_user_role=; path=/; max-age=0; SameSite=Lax";
  },

  isAuthenticated(): boolean {
    return (
      !this.isSessionExpired() && !!localStorage.getItem("agm_access_token")
    );
  },
};
