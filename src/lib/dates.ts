const TIME_ZONE = "Africa/Tunis";
const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** Calendar day (YYYY-MM-DD) in Tunisia, so late-evening orders land on the right day. */
export function tunisDay(date: Date) {
  return dayFormatter.format(date);
}

export function daysAgo(days: number, from = new Date()) {
  return new Date(from.getTime() - days * 86_400_000);
}

/** Compact relative time, e.g. "12 min ago", "3 h ago", "2 d ago". */
export function timeAgo(date: Date, now = new Date()) {
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function formatAdminDate(date: Date, withTime = false) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : { year: "numeric" }),
  }).format(date);
}
