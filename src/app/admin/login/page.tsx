import { AuthForm } from "@/components/auth/AuthForm";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-ink p-6 text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,166,70,.22),transparent_60%)]" />
      <div aria-hidden="true" className="grain -z-10" />
      <div className="w-full max-w-md">
        <div className="text-center">
          <Image src="/images/brand/hora-signature.webp" alt="HORA — Time. Redefined." width={580} height={700} priority className="mx-auto h-48 w-auto animate-scale-in" />
          <h1 className="mt-2 animate-fade-up text-sm text-white/60 [animation-delay:80ms]">Administration · authorised team members only</h1>
        </div>
        <div className="mt-8 animate-fade-up [animation-delay:160ms]"><AuthForm locale="en" mode="login" redirectTo="/admin" tone="dark" /></div>
      </div>
    </main>
  );
}
