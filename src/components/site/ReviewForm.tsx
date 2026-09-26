"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";

export function ReviewForm({
  productId,
  locale,
}: {
  productId: string;
  locale: Locale;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    setPending(true);
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: form.get("rating"),
          title: form.get("title"),
          body: form.get("body"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      setMessage(response.ok
        ? locale === "fr" ? "Avis envoyé pour modération." : "Review sent for moderation."
        : data.error ?? (locale === "fr" ? "Connectez-vous pour laisser un avis." : "Sign in to leave a review."));
      if (response.ok) formElement.reset();
    } catch {
      setMessage(locale === "fr" ? "Envoi impossible. Réessayez." : "Could not send your review. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="mt-8 grid max-w-xl gap-3 border-t border-black/10 pt-7">
      <h3 className="font-display text-2xl">{locale === "fr" ? "Donner votre avis" : "Write a review"}</h3>
      <label className="label" htmlFor="review-rating">{locale === "fr" ? "Note" : "Rating"}</label>
      <select id="review-rating" className="field" name="rating" required defaultValue="5">
        {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
      </select>
      <label className="sr-only" htmlFor="review-title">{locale === "fr" ? "Titre de l’avis" : "Review title"}</label>
      <input id="review-title" className="field" name="title" required minLength={3} maxLength={100} placeholder={locale === "fr" ? "Titre" : "Title"} />
      <label className="sr-only" htmlFor="review-body">{locale === "fr" ? "Votre expérience" : "Your experience"}</label>
      <textarea id="review-body" className="min-h-28 w-full border border-black/20 bg-white p-3 text-sm" name="body" required minLength={10} maxLength={1500} placeholder={locale === "fr" ? "Votre expérience" : "Your experience"} />
      <Button type="submit" disabled={pending}>{pending ? (locale === "fr" ? "Envoi…" : "Sending…") : (locale === "fr" ? "Envoyer" : "Submit")}</Button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
  );
}
