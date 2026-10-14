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
  logout: "M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
};

export function Icon({ name, className = "h-4 w-4" }: { name: keyof typeof PATHS | string; className?: string }) {
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
  completed: { label: "Achevé", className: "bg-surface-2 text-muted" },
};

export function HealthChip({ health }: { health: Health }) {
  const h = HEALTH[health];
  return <span className={`chip ${h.className}`}>{h.label}</span>;
}

export const HEALTH_BAR: Record<Health, string> = {
  ok: "var(--bar-ok)",
  risk: "var(--bar-risk)",
  late: "var(--bar-late)",
  completed: "#a9b8ae",
};

export function Avatar({ initials }: { initials: string }) {
  return (
    <span className="inline-grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e9ecea] text-[11px] font-semibold text-ink-2">
      {initials}
    </span>
  );
}

/** Section du tableau de bord : titre sur le fond de page, contenu dans un panneau. */
export function Section({
  title,
  aside,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`flex min-w-0 flex-col ${className}`} aria-label={title}>
      <div className="mb-2.5 flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="section-title">{title}</h2>
        {aside ? <div className="text-[13px] text-muted">{aside}</div> : null}
      </div>
      <div className={`panel flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function Meter({ value, color = "var(--bar-ok)", label }: { value: number; color?: string; label?: string }) {
  return (
    <div
      className="h-1 w-full overflow-hidden rounded-sm"
      style={{ background: "var(--track)" }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-sm" style={{ width: `${Math.min(100, value * 100)}%`, background: color }} />
    </div>
  );
}
