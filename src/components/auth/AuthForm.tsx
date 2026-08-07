"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export function AuthForm({
  locale,
  mode,
  redirectTo,
}: {
  locale: Locale;
  mode: "login" | "register";
  redirectTo: string;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Authentication failed");
      setPending(false);
      return;
    }
    window.location.assign(redirectTo);
  }
  return (
    <form onSubmit={submit} className="mx-auto mt-8 grid max-w-md gap-4 bg-white p-6 shadow-luxury">
      {mode === "register" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="label">{locale === "fr" ? "Prénom" : "First name"}</span><input className="field mt-2" name="firstName" required /></label>
          <label><span className="label">{locale === "fr" ? "Nom" : "Last name"}</span><input className="field mt-2" name="lastName" required /></label>
        </div>
      )}
      <label><span className="label">Email</span><input className="field mt-2" type="email" name="email" required autoComplete="email" /></label>
      {mode === "register" && <label><span className="label">{locale === "fr" ? "Téléphone" : "Phone"}</span><input className="field mt-2" name="phone" required placeholder="+216 22 111 222" /></label>}
      <label><span className="label">{locale === "fr" ? "Mot de passe" : "Password"}</span><input className="field mt-2" type="password" name="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "…" : mode === "login" ? locale === "fr" ? "Se connecter" : "Sign in" : locale === "fr" ? "Créer mon compte" : "Create account"}</Button>
    </form>
  );
}

export function LogoutButton({ label }: { label: string }) {
  return <button className="border-b border-black text-sm" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.reload(); }}>{label}</button>;
}
