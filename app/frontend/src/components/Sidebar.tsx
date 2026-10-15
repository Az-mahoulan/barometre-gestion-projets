"use client";

import type { Me } from "@/lib/types";

import { Icon } from "./ui";

const NAV = [
  { icon: "grid", label: "Tableau de bord", current: true },
  { icon: "folder", label: "Projets" },
  { icon: "task", label: "Mes tâches" },
  { icon: "calendar", label: "Calendrier" },
  { icon: "users", label: "Équipes" },
  { icon: "bell", label: "Notifications", badge: true },
  { icon: "chart", label: "Rapports" },
  { icon: "shield", label: "Administration", adminOnly: true },
];

export function Sidebar({ me, alerts }: { me: Me; alerts: number }) {
  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-[248px] shrink-0 flex-col rounded-[24px] bg-side px-4 py-[22px] text-white lg:flex">
      <div className="flex items-center gap-2.5 px-2 pb-6 text-[20px] font-extrabold">
        <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-lime text-ink">
          <Icon name="logo" className="h-5 w-5" />
        </span>
        Baromètre
      </div>

      <nav aria-label="Navigation principale" className="flex flex-col gap-1">
        {NAV.filter((n) => !n.adminOnly || me.role === "admin").map((n) => (
          <span
            key={n.label}
            aria-current={n.current ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[14px] px-3.5 py-[11px] text-[14px] ${
              n.current ? "bg-lime font-bold text-ink" : "font-medium text-[#c9cad0]"
            }`}
          >
            <Icon name={n.icon} className="h-5 w-5" />
            {n.label}
            {n.badge && alerts > 0 && (
              <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-peach-soft px-1 text-[11px] font-bold text-peach">{alerts}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="mt-auto rounded-[20px] bg-lime p-[18px] text-ink">
        <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-side text-white">
          <Icon name="sparkle" className="h-5 w-5" />
        </span>
        <b className="block text-[15px] leading-snug">Demandez à l’assistant</b>
        <p className="mt-1.5 text-[12px] leading-snug opacity-75">« Qui est disponible demain ? », « Crée une tâche pour Koffi » : bientôt disponible.</p>
      </div>
    </aside>
  );
}
