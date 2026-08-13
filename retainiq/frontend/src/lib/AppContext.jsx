import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem("retainiq_auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredAuth);
  // Whether /analyze or /analyze/demo has been called this session, which is
  // what populates the backend's customer cache that every case-workflow
  // endpoint reads from. Persisted so a page refresh (or a direct link to
  // /customer/:id) doesn't bounce the user back to Upload while the backend
  // cache is still populated — only logout clears it.
  const [datasetLoaded, setDatasetLoadedState] = useState(() => localStorage.getItem("retainiq_dataset_loaded") === "1");

  const setDatasetLoaded = (value) => {
    if (value) localStorage.setItem("retainiq_dataset_loaded", "1");
    else localStorage.removeItem("retainiq_dataset_loaded");
    setDatasetLoadedState(value);
  };

  const login = (loginResponse) => {
    const nextAuth = {
      token: loginResponse.access_token,
      email: loginResponse.email,
      role: loginResponse.role,
      displayName: loginResponse.display_name,
    };
    localStorage.setItem("retainiq_auth", JSON.stringify(nextAuth));
    setAuth(nextAuth);
  };

  const logout = () => {
    localStorage.removeItem("retainiq_auth");
    setAuth(null);
    setDatasetLoaded(false);
  };

  return (
    <AppContext.Provider value={{ auth, login, logout, datasetLoaded, setDatasetLoaded }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
