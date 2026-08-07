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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
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
    setMessage(
      response.ok
        ? locale === "fr" ? "Avis envoyé pour modération." : "Review sent for moderation."
        : data.error ?? (locale === "fr" ? "Connectez-vous pour laisser un avis." : "Sign in to leave a review."),
    );
    if (response.ok) event.currentTarget.reset();
  }
  return (
    <form onSubmit={submit} className="mt-8 grid max-w-xl gap-3 border-t border-black/10 pt-7">
      <h3 className="font-display text-2xl">{locale === "fr" ? "Donner votre avis" : "Write a review"}</h3>
      <select className="field" name="rating" required defaultValue="5" aria-label="Rating">
        {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
      </select>
      <input className="field" name="title" required minLength={3} maxLength={100} placeholder={locale === "fr" ? "Titre" : "Title"} />
      <textarea className="min-h-28 w-full border border-black/20 bg-white p-3 text-sm" name="body" required minLength={10} maxLength={1500} placeholder={locale === "fr" ? "Votre expérience" : "Your experience"} />
      <Button type="submit">{locale === "fr" ? "Envoyer" : "Submit"}</Button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
  );
}
