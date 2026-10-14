import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { FaBoxArchive, FaCircleCheck, FaFlag, FaUsersGear } from "react-icons/fa6";
import {
  LuBell,
  LuCalendarDays,
  LuChartNoAxesColumn,
  LuCheck,
  LuChevronDown,
  LuClock,
  LuFlag,
  LuFolder,
  LuLayoutGrid,
  LuListChecks,
  LuLogOut,
  LuMapPin,
  LuSearch,
  LuSend,
  LuSettings,
  LuShieldCheck,
  LuSparkles,
  LuUpload,
  LuUsers,
} from "react-icons/lu";
import { MdYoutubeSearchedFor } from "react-icons/md";

import type { Health } from "@/lib/types";


// Icônes de l'interface : Lucide (au trait), importées via react-icons. Elles prennent la couleur du texte.
const ICONS: Record<string, IconType> = {
  grid: LuLayoutGrid,
  folder: LuFolder,
  task: LuListChecks,
  calendar: LuCalendarDays,
  users: LuUsers,
  chart: LuChartNoAxesColumn,
  shield: LuShieldCheck,
  gear: LuSettings,
  search: LuSearch,
  bell: LuBell,
  sparkle: LuSparkles,
  upload: LuUpload,
  send: LuSend,
  flag: LuFlag,
  clock: LuClock,
  check: LuCheck,
  chevron: LuChevronDown,
  pin: LuMapPin,
  logout: LuLogOut,
};

export function Icon({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  const Svg = ICONS[name];
  return Svg ? <Svg className={`shrink-0 ${className}`} aria-hidden="true" /> : null;
}

// Icônes des tuiles de progression : Font Awesome et Material (pleines), comme la référence « Task Flow ».
const TILE_ICONS: Record<string, IconType> = {
  todo: FaBoxArchive,
  doing: FaUsersGear,
  done: FaFlag,
  review: MdYoutubeSearchedFor,
  approved: FaCircleCheck,
};

export function TileIcon({ name, className = "h-9 w-9" }: { name: string; className?: string }) {
  const Svg = TILE_ICONS[name];
  return Svg ? <Svg className={`shrink-0 ${className}`} aria-hidden="true" /> : null;
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
