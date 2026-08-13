import { NavLink, useNavigate } from "react-router-dom";
import { ROLE_LABELS, NAV_ITEMS, ROLE_BASE_PATH } from "../lib/roles";
import { useApp } from "../lib/AppContext";

export default function Sidebar() {
  const { auth, logout } = useApp();
  const navigate = useNavigate();
  const basePath = ROLE_BASE_PATH[auth.role];
  const items = NAV_ITEMS[auth.role];

  return (
    <div className="w-60 shrink-0 h-screen sticky top-0 border-r border-navy-700 bg-navy-900/60 flex flex-col">
      <div className="px-5 py-6">
        <h1 className="text-xl font-semibold text-white">
          Retain<span className="text-accent-light">IQ</span>
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map(([path, label]) => (
          <NavLink
            key={path}
            to={`${basePath}/${path}`}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-slate-400 hover:text-white hover:bg-navy-800"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-5 border-t border-navy-700">
        <p className="text-white text-sm font-medium truncate">{auth.displayName}</p>
        <p className="text-accent-light text-xs mb-3">{ROLE_LABELS[auth.role]}</p>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/upload")} className="text-slate-500 hover:text-white text-xs">
            Reload data
          </button>
          <button onClick={logout} className="text-slate-500 hover:text-white text-xs">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
