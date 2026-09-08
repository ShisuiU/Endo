/** Date locale au format YYYY-MM-DD (jamais UTC, pour éviter le décalage
 * de fin de journée selon le fuseau de l'utilisateur). */
export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return isoDate(new Date());
}

/** Vrai si la chaîne est bien une date YYYY-MM-DD existante. Rejette aussi
 * les dates qui « débordent » (2026-13-45 deviendrait 2027-02-14). */
export function isValidISODate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return !Number.isNaN(date.getTime()) && isoDate(date) === value;
}

const DAY_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function friendlyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const label = DAY_FORMATTER.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const diff = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(diff / 86_400_000);
}
