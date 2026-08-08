import { AuthForm } from "@/components/auth/AuthForm";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink p-6 text-center text-white">
      <div className="w-full max-w-lg">
        <p className="font-display text-4xl tracking-[.2em] text-gold">HORA</p>
        <h1 className="mt-5 font-display text-4xl">Hora Admin</h1>
        <p className="mt-3 text-sm text-white/60">Authorized team members only</p>
        <div className="text-left text-ink"><AuthForm locale="fr" mode="login" redirectTo="/admin" /></div>
        <p className="mt-5 text-xs text-white/45">Development seed: admin@hora.tn · password documented in README. Change it before any real use.</p>
      </div>
    </main>
  );
}
