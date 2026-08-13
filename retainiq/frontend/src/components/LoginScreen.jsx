import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginRequest } from "../lib/api";
import { ROLE_LABELS, QUICK_LOGINS } from "../lib/roles";
import { useApp } from "../lib/AppContext";

export default function LoginScreen() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const doLogin = async (e, overrideEmail, overridePassword) => {
    if (e) e.preventDefault();
    const useEmail = overrideEmail ?? email;
    const usePassword = overridePassword ?? password;
    setLoading(true);
    setError(null);
    try {
      const data = await loginRequest(useEmail, usePassword);
      login(data);
      navigate("/upload");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">
          Retain<span className="text-accent-light">IQ</span>
        </h1>
        <p className="text-slate-400">Sign in to manage customer churn risk and retention.</p>
      </div>

      <form onSubmit={doLogin} className="w-full max-w-sm space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {error && (
        <div className="mt-4 w-full max-w-sm rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4 w-full max-w-sm my-6">
        <div className="h-px bg-navy-700 flex-1" />
        <span className="text-slate-500 text-xs">demo quick login</span>
        <div className="h-px bg-navy-700 flex-1" />
      </div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-2">
        {QUICK_LOGINS.map((u) => (
          <button
            key={u.email}
            onClick={() => doLogin(null, u.email, u.password)}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-navy-900 border border-navy-700 hover:border-accent/50 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {ROLE_LABELS[u.role]}
          </button>
        ))}
      </div>
    </div>
  );
}
