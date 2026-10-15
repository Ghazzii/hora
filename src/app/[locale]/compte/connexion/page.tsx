import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { isLocale } from "@/lib/i18n";
import { safeRedirect } from "@/lib/utils";

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string | string[] }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const french = locale === "fr";
  const next = safeRedirect(query.next, `/${locale}/compte`);
  return (
    <div className="container section flex min-h-[60vh] justify-center">
      <div className="w-full max-w-md">
        <p className="eyebrow animate-fade-up text-center">{french ? "Votre espace" : "Your account"}</p>
        <h1 className="heading-lg mt-3 animate-fade-up text-center [animation-delay:80ms]">{french ? "Connexion" : "Sign in"}</h1>
        <div className="mt-10 animate-fade-up [animation-delay:160ms]"><AuthForm locale={locale} mode="login" redirectTo={next} /></div>
        <p className="mt-6 text-center text-sm text-ink/60">
          {french ? "Pas encore de compte ?" : "No account yet?"}{" "}
          <Link className="font-semibold text-ink underline underline-offset-4" href={`/${locale}/compte/inscription${next !== `/${locale}/compte` ? `?next=${encodeURIComponent(next)}` : ""}`}>{french ? "Créer un compte" : "Create one"}</Link>
        </p>
      </div>
    </div>
  );
}
