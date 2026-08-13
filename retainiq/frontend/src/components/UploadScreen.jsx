import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDemo, uploadCsv } from "../lib/api";
import { ROLE_LABELS, canUpload, roleHomePath } from "../lib/roles";
import { useApp } from "../lib/AppContext";

export default function UploadScreen() {
  const { auth, setDatasetLoaded, logout } = useApp();
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const uploadAllowed = canUpload(auth.role);

  const onLoaded = () => {
    setDatasetLoaded(true);
    navigate(roleHomePath(auth.role));
  };

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setLoading(true);
      setError(null);
      try {
        await uploadCsv(auth.token, file, 12);
        onLoaded();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [auth.token]
  );

  const handleDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchDemo(auth.token, 12);
      onLoaded();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [auth.token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="absolute top-6 right-6 flex items-center gap-3 text-sm">
        <span className="text-slate-400">
          {auth.displayName} · <span className="text-accent-light">{ROLE_LABELS[auth.role]}</span>
        </span>
        <button onClick={logout} className="text-slate-500 hover:text-white">
          Log out
        </button>
      </div>

      <div className="w-full max-w-2xl text-center mb-10">
        <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">
          Retain<span className="text-accent-light">IQ</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Predict who's likely to churn, understand why, and route each
          customer through the right retention workflow.
        </p>
      </div>

      {uploadAllowed ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={`w-full max-w-2xl rounded-2xl border-2 border-dashed p-14 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-accent bg-accent/10"
              : "border-navy-700 bg-navy-900/60 hover:border-navy-600"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <p className="text-slate-300 font-medium mb-1">
            Drop a customer CSV here, or click to browse
          </p>
          <p className="text-slate-500 text-sm">
            Required columns: customer_id, name, tenure_months, monthly_charges,
            contract_type, usage_units, usage_change_pct, complaints_3m,
            payment_failures_6m, payment_method
          </p>
          <p className="text-slate-600 text-xs mt-1">
            usage_units / usage_change_pct = whatever engagement metric fits
            your business — GB for broadband, watch-hours for OTT, check-ins
            for a gym, active logins for SaaS.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-2xl rounded-2xl border border-navy-700 bg-navy-900/40 p-8 text-center">
          <p className="text-slate-400 text-sm">
            Only <span className="text-accent-light">Retention Manager</span>{" "}
            accounts can upload new customer data. You can still explore the
            demo dataset below.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 w-full max-w-2xl my-8">
        <div className="h-px bg-navy-700 flex-1" />
        <span className="text-slate-500 text-sm">or</span>
        <div className="h-px bg-navy-700 flex-1" />
      </div>

      <button
        onClick={handleDemo}
        disabled={loading}
        className="px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-dark text-white font-medium text-lg shadow-lg shadow-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Loading…" : "Load demo data"}
      </button>

      {error && (
        <div className="mt-6 w-full max-w-2xl rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
