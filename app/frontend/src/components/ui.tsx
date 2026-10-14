import type { ReactNode } from "react";

import type { Health } from "@/lib/types";

const PATHS: Record<string, string> = {
  grid: "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z",
  task: "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8.5 12l2.5 2.5 4.5-5",
  calendar: "M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 10h16M9 3v4M15 3v4",
  users: "M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.5A6.5 6.5 0 0 1 21.5 20",
  chart: "M4 20V10M12 20V4M20 20v-7",
  shield: "M12 3 4 6v6c0 4.5 3.2 7.7 8 9 4.8-1.3 8-4.5 8-9V6l-8-3z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2",
  search: "M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.2-4.2",
  bell: "M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0",
  sparkle: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z",
  upload: "M12 16V5M7 10l5-5 5 5M5 20h14",
  send: "M12 19V5M6 11l6-6 6 6",
  flag: "M5 21V4M5 4h12l-2 4 2 4H5",
  clock: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 8v4l3 2",
  check: "M5 12l4.5 4.5L19 7",
  chevron: "M6 9l6 6 6-6",
  pin: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  logout: "M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9",
};

export function Icon({ name, className = "h-[17px] w-[17px]" }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}

const HEALTH: Record<Health, { label: string; className: string }> = {
  ok: { label: "Dans les temps", className: "bg-ok-soft text-ok" },
  risk: { label: "À surveiller", className: "bg-risk-soft text-risk" },
  late: { label: "En retard", className: "bg-late-soft text-late" },
  completed: { label: "Achevé", className: "bg-ok-soft text-ok" },
};

export function HealthChip({ health }: { health: Health }) {
  const h = HEALTH[health];
  return <span className={`chip ${h.className}`}>{h.label}</span>;
}

export const HEALTH_BAR: Record<Health, string> = {
  ok: "var(--bar-ok)",
  risk: "var(--bar-risk)",
  late: "var(--bar-late)",
  completed: "var(--bar-ok)",
};

export function Avatar({ initials, tone = "green" }: { initials: string; tone?: "green" | "gray" }) {
  const cls = tone === "green" ? "bg-ok-soft text-ok" : "bg-surface-2 text-ink-2 border border-line";
  return (
    <span className={`inline-grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11.5px] font-semibold ${cls}`}>
      {initials}
    </span>
  );
}

export function CardHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {aside ? <div className="text-[12.5px] text-muted">{aside}</div> : null}
    </div>
  );
}

export function Meter({ value, color = "var(--bar-ok)" }: { value: number; color?: string }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full"
      style={{ background: "var(--track)" }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, value * 100)}%`, background: color }} />
    </div>
  );
}
