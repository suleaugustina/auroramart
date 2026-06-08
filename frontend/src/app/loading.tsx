export default function Loading() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-ink rounded-full animate-spin" />
        <p className="text-xs text-gray-400 uppercase tracking-widest">Loading</p>
      </div>
    </div>
  );
}
