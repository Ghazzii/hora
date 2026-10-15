export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="skeleton h-3 w-32" />
      <div className="skeleton mt-4 h-12 w-72" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-32 rounded-2xl" />)}</div>
      <div className="skeleton mt-6 h-80 rounded-2xl" />
    </div>
  );
}
