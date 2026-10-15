export default function Loading() {
  return (
    <div className="container section min-h-[55vh]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement… / Loading…</span>
      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-5 h-14 w-full max-w-xl" />
      <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} style={{ animationDelay: `${index * 80}ms` }} className="animate-fade-in">
            <div className="skeleton aspect-[4/5] rounded-2xl" />
            <div className="skeleton mt-4 h-3 w-1/3" />
            <div className="skeleton mt-3 h-5 w-2/3" />
            <div className="skeleton mt-3 h-4 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
