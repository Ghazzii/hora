import type { ReactNode } from "react";

export function InfoPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="container section min-h-[55vh]">
      <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow animate-fade-up">{eyebrow}</p>
          <h1 className="heading-lg mt-4 animate-fade-up [animation-delay:80ms]">{title}</h1>
          <span aria-hidden="true" className="mt-8 block h-px w-24 origin-left animate-fade-in bg-gold [animation-delay:200ms]" />
        </div>
        <div className="prose-hora animate-fade-up space-y-8 [animation-delay:160ms] [&>div+div]:border-t [&>div+div]:border-ink/10 [&>div+div]:pt-8">{children}</div>
      </div>
    </div>
  );
}
