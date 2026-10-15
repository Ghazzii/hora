import { MessageCircle, Phone } from "lucide-react";
import { formatTunisianPhone, whatsappLink } from "@/lib/phone";
import { cn } from "@/lib/utils";

/** One-tap call / WhatsApp buttons for confirming cash-on-delivery orders. */
export function ContactActions({ phone, orderNumber, firstName, size = "md", showNumber = false }: { phone: string; orderNumber?: string; firstName?: string; size?: "sm" | "md"; showNumber?: boolean }) {
  const message = orderNumber
    ? `Bonjour${firstName ? ` ${firstName}` : ""}, ici Hora. Nous vous contactons pour confirmer votre commande ${orderNumber}.`
    : undefined;
  const whatsapp = whatsappLink(phone, message);
  const button = cn(
    "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition",
    size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`tel:${phone}`} className={cn(button, "bg-ink text-white hover:bg-[#2a2722]")} aria-label={`Call ${formatTunisianPhone(phone)}`}>
        <Phone size={size === "sm" ? 13 : 15} /> {showNumber ? formatTunisianPhone(phone) : "Call"}
      </a>
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={cn(button, "bg-[#e7f6ec] text-[#0e6b34] hover:bg-[#d3efdc]")} aria-label={`WhatsApp ${formatTunisianPhone(phone)}`}>
          <MessageCircle size={size === "sm" ? 13 : 15} /> WhatsApp
        </a>
      )}
    </div>
  );
}
