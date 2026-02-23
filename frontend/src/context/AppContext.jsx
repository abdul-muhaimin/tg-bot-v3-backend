import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { initTelegram } from "../lib/telegram";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initTelegram();
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      // Fire both at the same time
      const [configRes, userRes] = await Promise.all([
        api.get("/config"),
        api.get("/users/me"),
      ]);
      setConfig(configRes.data);
      setUser(userRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        // Still need config even if user fails
        try {
          const configRes = await api.get("/config");
          setConfig(configRes.data);
        } catch {}
        setError("not_started");
      } else if (err.response?.data?.error === "banned") {
        setError("banned");
      } else {
        setError("generic");
      }
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch {}
  }

  async function acceptTnc() {
    const res = await api.post("/users/me/accept-tnc");
    setUser(res.data);
  }

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isSuperAdmin = user?.role === "superadmin";
  const systemOpen = config?.system_status === "open";

  const featureEnabled = (key) => config?.[key] === "true";

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        config,
        loading,
        error,
        refreshUser,
        acceptTnc,
        isAdmin,
        isSuperAdmin,
        systemOpen,
        featureEnabled,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
