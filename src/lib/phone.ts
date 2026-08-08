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
