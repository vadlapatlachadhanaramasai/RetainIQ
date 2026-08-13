import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../lib/AppContext";
import { roleHomePath } from "../lib/roles";

// Route guard: unauthenticated -> /login. Authenticated but wrong role for
// this branch (e.g. a Retention Team user typing /business-owner/dashboard)
// -> redirected to their own role's home, never shown the restricted page.
export default function ProtectedRoute({ allowedRoles, children }) {
  const { auth } = useApp();
  const location = useLocation();

  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to={roleHomePath(auth.role)} replace />;
  }

  return children;
}
