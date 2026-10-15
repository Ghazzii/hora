"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AuthForm({
  locale,
  mode,
  redirectTo,
  tone = "light",
}: {
  locale: Locale;
  mode: "login" | "register";
  redirectTo: string;
  tone?: "light" | "dark";
}) {
  const french = locale === "fr";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(
          response.status === 429
            ? french ? "Trop de tentatives. Patientez une minute." : "Too many attempts. Please wait a minute."
            : response.status === 409
              ? french ? "Cette adresse email est déjà utilisée." : "This email is already registered."
              : response.status === 422
                ? french ? "Vérifiez vos informations (téléphone tunisien, mot de passe de 8 caractères min.)." : "Check your details (Tunisian phone, password of 8+ characters)."
                : french ? "Email ou mot de passe incorrect." : "Incorrect email or password.",
        );
        setPending(false);
        return;
      }
      window.location.assign(redirectTo);
    } catch {
      setError(french ? "Connexion interrompue. Réessayez." : "Connection interrupted. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className={cn("grid gap-5 rounded-3xl p-6 text-left sm:p-8", tone === "dark" ? "bg-white text-ink shadow-luxury" : "bg-white shadow-soft")}>
      {mode === "register" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <label><span className="label">{french ? "Prénom" : "First name"}</span><input className="field mt-2" name="firstName" required autoComplete="given-name" minLength={2} maxLength={80} /></label>
          <label><span className="label">{french ? "Nom" : "Last name"}</span><input className="field mt-2" name="lastName" required autoComplete="family-name" minLength={2} maxLength={80} /></label>
        </div>
      )}
      <label><span className="label">Email</span><input className="field mt-2" type="email" name="email" required autoComplete="email" /></label>
      {mode === "register" && <label><span className="label">{french ? "Téléphone" : "Phone"}</span><input className="field mt-2" name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+216 22 111 222" /></label>}
      <div>
        <label htmlFor={`password-${mode}`} className="label">{french ? "Mot de passe" : "Password"}</label>
        <div className="relative mt-2">
          <input id={`password-${mode}`} className="field pr-12" type={showPassword ? "text" : "password"} name="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition hover:bg-ink/[.06] hover:text-ink" aria-label={showPassword ? (french ? "Masquer le mot de passe" : "Hide password") : french ? "Afficher le mot de passe" : "Show password"}>
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {mode === "register" && <p className="mt-1.5 text-xs text-ink/45">{french ? "8 caractères minimum." : "At least 8 characters."}</p>}
      </div>
      {error && <p role="alert" className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending && <Loader2 size={17} className="animate-spin" />}
        {mode === "login" ? (french ? "Se connecter" : "Sign in") : french ? "Créer mon compte" : "Create account"}
      </button>
    </form>
  );
}

export function LogoutButton({ label, redirectTo, className }: { label: string; redirectTo?: string; className?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      className={cn("btn-outline h-10 px-4", className)}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        if (redirectTo) window.location.assign(redirectTo);
        else window.location.reload();
      }}
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />} {label}
    </button>
  );
}
