"use client";

import type { Me } from "@/lib/types";

import { Avatar, Icon } from "./ui";

// Seul le tableau de bord existe pour l'instant ; les autres écrans sont annoncés sans être cliquables.
const UPCOMING = [
  { icon: "folder", label: "Projets" },
  { icon: "task", label: "Mes tâches" },
  { icon: "calendar", label: "Calendrier" },
  { icon: "users", label: "Équipes" },
  { icon: "chart", label: "Rapports" },
  { icon: "shield", label: "Administration", adminOnly: true },
];

export function Sidebar({ me, onLogout }: { me: Me; onLogout: () => void }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[224px] shrink-0 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
      <div className="px-3 pb-6 text-[18px] font-semibold tracking-[-0.2px]">Baromètre</div>

      <nav aria-label="Navigation principale" className="flex flex-col gap-0.5">
        <span aria-current="page" className="flex items-center gap-2.5 rounded-lg bg-[#eef1ef] px-3 py-2 font-medium text-ink">
          <Icon name="grid" />
          Tableau de bord
        </span>
        {UPCOMING.filter((n) => !n.adminOnly || me.role === "admin").map((n) => (
          <span key={n.label} aria-disabled="true" className="flex items-center gap-2.5 px-3 py-2 text-[#8c938f]">
            <Icon name={n.icon} />
            {n.label}
            <span className="ml-auto text-[12px]">bientôt</span>
          </span>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-line px-1 pt-3">
        <Avatar initials={me.initials} />
        <div className="min-w-0 leading-tight">
          <span className="block truncate text-[13px] font-medium">{me.name}</span>
          <span className="text-[12px] text-muted">{me.role_label}</span>
        </div>
        <button onClick={onLogout} className="ml-auto rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Se déconnecter" title="Se déconnecter">
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}
