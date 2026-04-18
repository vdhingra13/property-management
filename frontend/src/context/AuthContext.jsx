import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, setAuthToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("harbor-token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setAuthToken(null);
      setLoading(false);
      return;
    }

    setAuthToken(token);
    apiRequest("/auth/me")
      .then((response) => setUser(response.user))
      .catch(() => {
        localStorage.removeItem("harbor-token");
        setToken(null);
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      async login(credentials) {
        const response = await apiRequest("/auth/login", {
          method: "POST",
          body: credentials
        });
        localStorage.setItem("harbor-token", response.token);
        setToken(response.token);
        setAuthToken(response.token);
        setUser(response.user);
      },
      async register(payload) {
        const response = await apiRequest("/auth/register", {
          method: "POST",
          body: payload
        });
        localStorage.setItem("harbor-token", response.token);
        setToken(response.token);
        setAuthToken(response.token);
        setUser(response.user);
      },
      logout() {
        localStorage.removeItem("harbor-token");
        setToken(null);
        setUser(null);
        setAuthToken(null);
      }
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
