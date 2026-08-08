import type { ReactNode } from "react";
export function InfoPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <div className="container section min-h-[50vh]"><p className="eyebrow">{eyebrow}</p><h1 className="heading-lg mt-3">{title}</h1><div className="prose-hora mt-8 space-y-6">{children}</div></div>;
}
