export function normalizeTunisianPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let national = digits;
  if (national.startsWith("+216")) national = national.slice(4);
  else if (national.startsWith("00216")) national = national.slice(5);
  else if (national.startsWith("216") && national.length === 11) {
    national = national.slice(3);
  }
  national = national.replace(/\D/g, "");
  if (!/^[234579]\d{7}$/.test(national)) return null;
  return `+216${national}`;
}

export function isTunisianPhone(input: string): boolean {
  return normalizeTunisianPhone(input) !== null;
}

/** wa.me link for a stored +216 number, or null when the number is not Tunisian. */
export function whatsappLink(phone: string, message?: string): string | null {
  const normalized = normalizeTunisianPhone(phone);
  if (!normalized) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized.slice(1)}${text}`;
}

/** Human-friendly "+216 22 111 222" formatting. */
export function formatTunisianPhone(phone: string): string {
  const normalized = normalizeTunisianPhone(phone);
  if (!normalized) return phone;
  const digits = normalized.slice(4);
  return `+216 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}
