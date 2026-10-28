export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
        </div>
        <p className="text-sm font-medium text-slate-400">Loading…</p>
      </div>
    </div>
  );
}
