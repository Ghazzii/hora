"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  locale,
}: {
  productId: string;
  locale: Locale;
}) {
  const french = locale === "fr";
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string; signIn?: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage(null);
    setPending(true);
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, rating, title: form.get("title"), body: form.get("body") }),
      });
      if (response.ok) {
        setMessage({ tone: "ok", text: french ? "Merci ! Votre avis sera publié après modération." : "Thank you! Your review will appear after moderation." });
        formElement.reset();
        setRating(5);
      } else if (response.status === 401) {
        setMessage({ tone: "error", text: french ? "Connectez-vous pour laisser un avis." : "Sign in to leave a review.", signIn: true });
      } else if (response.status === 409) {
        setMessage({ tone: "error", text: french ? "Vous avez déjà donné votre avis sur cette montre." : "You have already reviewed this watch." });
      } else {
        setMessage({ tone: "error", text: french ? "Vérifiez votre titre (3 caractères min.) et votre texte (10 caractères min.)." : "Check your title (3+ characters) and text (10+ characters)." });
      }
    } catch {
      setMessage({ tone: "error", text: french ? "Envoi impossible. Réessayez." : "Could not send your review. Please try again." });
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn-outline" onClick={() => setOpen(true)}>
        {french ? "Donner votre avis" : "Write a review"}
      </button>
    );
  }

  const shown = hover ?? rating;
  return (
    <form onSubmit={submit} className="card grid max-w-xl animate-scale-in gap-4 p-6">
      <h3 className="font-display text-2xl font-medium">{french ? "Votre avis" : "Your review"}</h3>
      <fieldset>
        <legend className="label">{french ? "Note" : "Rating"}</legend>
        <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer" onMouseEnter={() => setHover(value)}>
              <input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} className="peer sr-only" />
              <span className="sr-only">{value} / 5</span>
              <Star
                size={28}
                strokeWidth={1.4}
                className={cn("rounded transition duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-gold", value <= shown ? "scale-105 fill-gold text-gold" : "text-ink/25")}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        <span className="label">{french ? "Titre" : "Title"}</span>
        <input className="field mt-2" name="title" required minLength={3} maxLength={100} placeholder={french ? "En un mot…" : "In a few words…"} />
      </label>
      <label>
        <span className="label">{french ? "Votre expérience" : "Your experience"}</span>
        <textarea className="field mt-2" name="body" required minLength={10} maxLength={1500} rows={4} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>{pending ? (french ? "Envoi…" : "Sending…") : french ? "Publier l'avis" : "Submit review"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{french ? "Annuler" : "Cancel"}</button>
      </div>
      {message && (
        <p role="status" className={cn("rounded-xl px-4 py-3 text-sm", message.tone === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>
          {message.text}{" "}
          {message.signIn && <Link href={`/${locale}/compte/connexion?next=${encodeURIComponent(typeof window === "undefined" ? `/${locale}` : window.location.pathname)}`} className="font-semibold underline">{french ? "Se connecter" : "Sign in"}</Link>}
        </p>
      )}
    </form>
  );
}
