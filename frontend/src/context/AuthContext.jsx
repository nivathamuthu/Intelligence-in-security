import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);
const TOKEN_KEY = "admin_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    function onUnauthorized() {
      setToken(null);
    }
    window.addEventListener("admin-unauthorized", onUnauthorized);
    return () => window.removeEventListener("admin-unauthorized", onUnauthorized);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      async login(username, password) {
        const data = await authApi.login(username, password);
        localStorage.setItem(TOKEN_KEY, data.access_token);
        setToken(data.access_token);
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      },
    }),
    [token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
