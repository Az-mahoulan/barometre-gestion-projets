import type { ReactNode } from "react";

import type { Health } from "@/lib/types";

import { MONO_ICONS, TILE_ICONS } from "./icons.generated";

/** Icône au trait (Solar) : prend la couleur du texte. */
export function Icon({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  const icon = MONO_ICONS[name];
  if (!icon) return null;
  return (
    <svg
      viewBox={icon.viewBox}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}

/** Icône pleine des tuiles de progression : prend la couleur du texte. */
export function TileIcon({ name, className = "h-10 w-10" }: { name: string; className?: string }) {
  const icon = TILE_ICONS[name];
  if (!icon) return null;
  return <svg viewBox={icon.viewBox} className={`shrink-0 ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: icon.body }} />;
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
