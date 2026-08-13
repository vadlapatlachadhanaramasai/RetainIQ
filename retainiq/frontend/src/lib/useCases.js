import { useCallback, useEffect, useState } from "react";
import { getCases } from "./api";
import { useApp } from "./AppContext";

// Shared data source for every list-shaped page (Dashboard, Customers at
// Risk, My Team, Assignments, Tickets, ...). Each page applies its own
// filter/sort on top of the same GET /cases response instead of hitting a
// bespoke endpoint per nav item — the backend is already the single source
// of truth for what this role is allowed to see.
export function useCases() {
  const { auth } = useApp();
  const [cases, setCases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    getCases(auth.token)
      .then((d) => setCases(d.cases))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [auth.token]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { cases, loading, error, reload };
}
