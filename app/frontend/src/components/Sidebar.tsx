"use client";

import type { GanttProject, Me } from "@/lib/types";

import { Avatar, HEALTH_BAR, Icon } from "./ui";

const NAV = [
  { icon: "grid", label: "Tableau de bord", current: true },
  { icon: "folder", label: "Projets" },
  { icon: "task", label: "Mes tâches" },
  { icon: "calendar", label: "Calendrier" },
  { icon: "users", label: "Équipes" },
  { icon: "chart", label: "Rapports" },
  { icon: "shield", label: "Administration", adminOnly: true },
];

export function Sidebar({ me, projects, onLogout }: { me: Me; projects: GanttProject[]; onLogout: () => void }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r border-line bg-surface px-3.5 py-5 lg:flex">
      <div className="flex items-center gap-2.5 px-2 pb-5 text-[19px] font-bold tracking-tight">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-white">
          <Icon name="chart" className="h-[15px] w-[15px]" />
        </span>
        Baromètre
      </div>

      <nav aria-label="Navigation principale" className="flex flex-col gap-0.5">
        {NAV.filter((n) => !n.adminOnly || me.role === "admin").map((n) => (
          <span
            key={n.label}
            aria-current={n.current ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-[9px] px-3 py-2 text-sm font-medium ${
              n.current ? "bg-[#eef1f4] text-ink" : "text-ink-2"
            }`}
          >
            <Icon name={n.icon} />
            {n.label}
          </span>
        ))}
      </nav>

      <div className="mt-3.5 border-t border-line pt-3">
        <div className="px-3 pb-1.5 text-[11.5px] font-medium tracking-wide text-muted">PROJETS EN COURS</div>
        <ul className="flex flex-col">
          {projects
            .filter((p) => p.status === "active")
            .slice(0, 6)
            .map((p) => (
              <li key={p.id} className="flex items-center gap-2.5 px-3 py-1.5 text-[13.5px] text-ink-2">
                <i className="block h-[9px] w-[9px] shrink-0 rounded-[3px]" style={{ background: HEALTH_BAR[p.health] }} />
                <span className="truncate">{p.name}</span>
              </li>
            ))}
        </ul>
      </div>

      <div className="mt-auto border-t border-line pt-3">
        <div className="flex items-center gap-2.5">
          <Avatar initials={me.initials} />
          <div className="min-w-0 leading-tight">
            <b className="block truncate text-[13.5px] font-semibold">{me.name}</b>
            <span className="text-xs text-muted">{me.role_label}</span>
          </div>
          <button onClick={onLogout} className="ml-auto rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label="Se déconnecter">
            <Icon name="logout" />
          </button>
        </div>
      </div>
    </aside>
  );
}
