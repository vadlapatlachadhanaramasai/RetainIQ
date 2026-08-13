import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useApp } from "../lib/AppContext";
import { useEffect } from "react";

// Layout for every logged-in, data-loaded page: sidebar + content area.
// Also the single place that guards "you must have loaded a dataset before
// you can see any role page" — redirects back to /upload otherwise.
export default function AppShell() {
  const { datasetLoaded } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!datasetLoaded) navigate("/upload", { replace: true });
  }, [datasetLoaded, navigate]);

  if (!datasetLoaded) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
