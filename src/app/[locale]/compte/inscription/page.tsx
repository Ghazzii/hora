import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { isLocale } from "@/lib/i18n";
import { safeRedirect } from "@/lib/utils";

export default async function RegisterPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string | string[] }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const french = locale === "fr";
  const next = safeRedirect(query.next, `/${locale}/compte`);
  return (
    <div className="container section flex min-h-[60vh] justify-center">
      <div className="w-full max-w-lg">
        <p className="eyebrow animate-fade-up text-center">{french ? "Votre espace" : "Your account"}</p>
        <h1 className="heading-lg mt-3 animate-fade-up text-center [animation-delay:80ms]">{french ? "Créer un compte" : "Create an account"}</h1>
        <p className="mx-auto mt-4 max-w-sm animate-fade-up text-center text-sm text-ink/55 [animation-delay:120ms]">{french ? "Suivez vos commandes et donnez votre avis sur vos montres." : "Follow your orders and review your watches."}</p>
        <div className="mt-10 animate-fade-up [animation-delay:160ms]"><AuthForm locale={locale} mode="register" redirectTo={next} /></div>
        <p className="mt-6 text-center text-sm text-ink/60">
          {french ? "Déjà inscrit ?" : "Already registered?"}{" "}
          <Link className="font-semibold text-ink underline underline-offset-4" href={`/${locale}/compte/connexion`}>{french ? "Se connecter" : "Sign in"}</Link>
        </p>
      </div>
    </div>
  );
}
