const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

/** « 2026-10-14 » → Date locale (sans décalage de fuseau). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function shortDate(iso: string): string {
  const d = parseDate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function longDate(iso: string): string {
  return parseDate(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function dayLabel(iso: string): string {
  const d = parseDate(iso);
  return DAYS[(d.getDay() + 6) % 7];
}

export function monthShort(date: Date): string {
  return MONTHS[date.getMonth()];
}

export const pct = (value: number) => `${Math.round(value * 100)} %`;
