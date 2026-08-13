export function LoadingState({ label = "Loading…" }) {
  return <p className="text-slate-500 text-sm text-center py-16">{label}</p>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-300 text-sm">
      {message}
      {onRetry && (
        <button onClick={onRetry} className="ml-3 underline hover:text-rose-200">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }) {
  return <p className="text-slate-500 text-sm text-center py-16 border border-dashed border-navy-700 rounded-2xl">{message}</p>;
}
