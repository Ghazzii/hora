import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale } from "@/lib/i18n";
import { formatTnd } from "@/lib/money";
import { statusLabel } from "@/lib/order-rules";
import { LogoutButton } from "@/components/auth/AuthForm";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (!user) return <div className="container section min-h-[45vh] text-center"><h1 className="heading-lg">{locale === "fr" ? "Votre compte" : "Your account"}</h1><p className="mt-5 text-black/60">{locale === "fr" ? "Connectez-vous pour retrouver vos commandes et vos adresses." : "Sign in to see your orders and addresses."}</p><Link href={`/${locale}/compte/connexion`} className="mt-7 inline-flex bg-ink px-7 py-3 font-bold text-white">{locale === "fr" ? "Se connecter" : "Sign in"}</Link></div>;
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <div className="container section min-h-[45vh]">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{user.email}</p><h1 className="heading-lg mt-3">{locale === "fr" ? `Bonjour ${user.firstName}` : `Hello ${user.firstName}`}</h1></div><LogoutButton label={locale === "fr" ? "Se déconnecter" : "Sign out"} /></div>
      <h2 className="mt-12 font-display text-3xl">{locale === "fr" ? "Mes commandes" : "My orders"}</h2>
      <div className="mt-5 divide-y divide-black/10 border-y border-black/10">
        {orders.length ? orders.map((order) => <Link key={order.id} href={`/${locale}/compte/commandes/${order.id}`} className="grid gap-2 py-5 sm:grid-cols-4"><strong>{order.orderNumber}</strong><span>{order.createdAt.toLocaleDateString(locale === "fr" ? "fr-TN" : "en-TN")}</span><span>{statusLabel(order.status, locale)}</span><span className="sm:text-right">{formatTnd(order.totalMillimes, locale)}</span></Link>) : <p className="py-6 text-black/60">{locale === "fr" ? "Aucune commande." : "No orders."}</p>}
      </div>
    </div>
  );
}
