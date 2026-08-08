import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { isLocale } from "@/lib/i18n";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <div className="container section min-h-[55vh] text-center"><p className="eyebrow">{locale === "fr" ? "Votre espace" : "Your account"}</p><h1 className="heading-lg mt-3">{locale === "fr" ? "Connexion" : "Sign in"}</h1><AuthForm locale={locale} mode="login" redirectTo={`/${locale}/compte`} /><p className="mt-6 text-sm">{locale === "fr" ? "Pas encore de compte ?" : "No account yet?"} <Link className="font-bold underline" href={`/${locale}/compte/inscription`}>{locale === "fr" ? "S'inscrire" : "Register"}</Link></p></div>;
}
