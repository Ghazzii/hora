import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Package, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale } from "@/lib/i18n";
import { formatTnd } from "@/lib/money";
import { LogoutButton } from "@/components/auth/AuthForm";
import { OrderStatusPill } from "@/components/site/OrderProgress";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const french = locale === "fr";
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="container section flex min-h-[55vh] flex-col items-center justify-center text-center">
        <span className="grid h-20 w-20 animate-scale-in place-items-center rounded-full bg-sand text-gold-dark"><UserRound size={30} strokeWidth={1.4} /></span>
        <h1 className="heading-md mt-7 animate-fade-up">{french ? "Votre compte" : "Your account"}</h1>
        <p className="mt-3 max-w-md animate-fade-up text-ink/60 [animation-delay:80ms]">{french ? "Connectez-vous pour suivre vos commandes. Un compte n'est pas nécessaire pour commander." : "Sign in to follow your orders. You don't need an account to order."}</p>
        <div className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:160ms]">
          <Link href={`/${locale}/compte/connexion`} className="btn-primary">{french ? "Se connecter" : "Sign in"}</Link>
          <Link href={`/${locale}/compte/inscription`} className="btn-outline">{french ? "Créer un compte" : "Create an account"}</Link>
        </div>
      </div>
    );
  }
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: { select: { id: true } } } });
  const dateFormat = new Intl.DateTimeFormat(french ? "fr-TN" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="container section min-h-[55vh]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow animate-fade-up">{user.email}</p>
          <h1 className="heading-lg mt-3 animate-fade-up [animation-delay:80ms]">{french ? `Bonjour ${user.firstName}` : `Hello ${user.firstName}`}</h1>
        </div>
        <LogoutButton label={french ? "Se déconnecter" : "Sign out"} />
      </div>
      <h2 className="mt-14 font-display text-3xl font-medium">{french ? "Mes commandes" : "My orders"}</h2>
      {orders.length ? (
        <ul className="mt-6 grid gap-3">
          {orders.map((order, index) => (
            <li key={order.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
              <Link href={`/${locale}/compte/commandes/${order.id}`} className="group flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-sand text-gold-dark"><Package size={18} /></span>
                <span className="min-w-0 flex-1">
                  <strong className="block">{order.orderNumber}</strong>
                  <span className="text-xs text-ink/50">{dateFormat.format(order.createdAt)} · {order.items.length} {french ? (order.items.length > 1 ? "articles" : "article") : order.items.length > 1 ? "items" : "item"}</span>
                </span>
                <OrderStatusPill status={order.status} locale={locale} />
                <span className="font-semibold tabular-nums">{formatTnd(order.totalMillimes, locale)}</span>
                <ArrowRight size={16} className="text-ink/30 transition group-hover:translate-x-1 group-hover:text-ink" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-ink/15 px-6 py-12 text-center">
          <p className="text-ink/60">{french ? "Vous n'avez pas encore passé de commande avec ce compte." : "You haven't placed an order with this account yet."}</p>
          <Link href={`/${locale}/montres`} className="btn-primary mt-6">{french ? "Découvrir les montres" : "Discover watches"}</Link>
        </div>
      )}
    </div>
  );
}
