import type { ReactNode } from "react";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircle from "@mui/icons-material/CheckCircle";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import ChecklistOutlined from "@mui/icons-material/ChecklistOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import Flag from "@mui/icons-material/Flag";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import Inventory2 from "@mui/icons-material/Inventory2";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import ManageAccounts from "@mui/icons-material/ManageAccounts";
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import SendOutlined from "@mui/icons-material/SendOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import YoutubeSearchedFor from "@mui/icons-material/YoutubeSearchedFor";
import type SvgIcon from "@mui/material/SvgIcon";

import type { Health } from "@/lib/types";


// Icônes Material UI (@mui/icons-material). Interface : variante « Outlined » ; tuiles de progression : variante pleine.
const ICONS: Record<string, typeof SvgIcon> = {
  grid: GridViewOutlined,
  folder: FolderOutlined,
  task: ChecklistOutlined,
  calendar: CalendarMonthOutlined,
  users: GroupsOutlined,
  chart: BarChartOutlined,
  shield: AdminPanelSettingsOutlined,
  gear: SettingsOutlined,
  search: SearchOutlined,
  bell: NotificationsNoneOutlined,
  sparkle: AutoAwesomeOutlined,
  upload: FileUploadOutlined,
  send: SendOutlined,
  flag: FlagOutlined,
  clock: ScheduleOutlined,
  check: CheckOutlined,
  chevron: ExpandMoreOutlined,
  pin: PlaceOutlined,
  logout: LogoutOutlined,
};

const TILE_ICONS: Record<string, typeof SvgIcon> = {
  todo: Inventory2,
  doing: ManageAccounts,
  done: Flag,
  review: YoutubeSearchedFor,
  approved: CheckCircle,
};

// L'icône occupe toute la boîte définie par className (ex. h-4 w-4) et prend la couleur du texte.
function render(Svg: typeof SvgIcon | undefined, className: string) {
  if (!Svg) return null;
  return (
    <span className={`inline-flex shrink-0 ${className}`} aria-hidden="true">
      <Svg sx={{ width: "100%", height: "100%", color: "inherit" }} />
    </span>
  );
}

export function Icon({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  return render(ICONS[name], className);
}

export function TileIcon({ name, className = "h-9 w-9" }: { name: string; className?: string }) {
  return render(TILE_ICONS[name], className);
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
