export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] bg-navy-800 border border-accent/40 text-white px-5 py-3 rounded-xl shadow-2xl shadow-black/50 animate-[fadeIn_0.15s_ease-out]">
      {message}
    </div>
  );
}
