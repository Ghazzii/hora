import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { isLocale } from "@/lib/i18n";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <div className="container section min-h-[55vh] text-center"><p className="eyebrow">{locale === "fr" ? "Votre espace" : "Your account"}</p><h1 className="heading-lg mt-3">{locale === "fr" ? "Créer un compte" : "Create an account"}</h1><AuthForm locale={locale} mode="register" redirectTo={`/${locale}/compte`} /><p className="mt-6 text-sm"><Link className="font-bold underline" href={`/${locale}/compte/connexion`}>{locale === "fr" ? "Déjà inscrit ?" : "Already registered?"}</Link></p></div>;
}
