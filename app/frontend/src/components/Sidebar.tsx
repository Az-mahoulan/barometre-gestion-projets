"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Me, Member } from "@/lib/types";

import { Avatar, Icon } from "./ui";

const NAV = [
  { href: "/", icon: "grid", label: "Tableau de bord" },
  { href: "/projets", icon: "folder", label: "Projets" },
  { href: "/taches", icon: "task", label: "Mes tâches" },
  { href: "/calendrier", icon: "calendar", label: "Calendrier" },
  { href: "/equipes", icon: "users", label: "Équipes" },
  { href: "/notifications", icon: "bell", label: "Notifications", badge: true },
  { href: "/rapports", icon: "chart", label: "Rapports" },
  { href: "/administration", icon: "shield", label: "Administration", adminOnly: true },
];

export function Sidebar({
  me,
  alerts = 0,
  members = [],
  subtitle,
}: {
  me: Me;
  alerts?: number;
  members?: Member[];
  subtitle: string;
}) {
  const pathname = usePathname();
  const first = me.name.split(" ")[0];
  const shown = members.slice(0, 4);
  return (
    <aside className="sticky top-3 hidden print:!hidden h-[calc(100vh-24px)] w-[216px] shrink-0 flex-col overflow-y-auto px-2 py-3 [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center gap-2.5 px-1 text-[17px] font-bold">
        <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-side text-lime">
          <Icon name="logo" className="h-5 w-5" />
        </span>
        Baromètre
      </div>

      <div className="mt-5 px-1">
        <p className="text-[19px] font-bold leading-tight tracking-[-0.3px]">
          {first && first !== "Administration" ? `Bonjour ${first}` : "Bonjour"}
        </p>
        <p className="mt-1 text-[11.5px] leading-snug text-muted">{subtitle}</p>
      </div>

      <div className="mt-5 flex items-center justify-between px-1 text-[11.5px] font-semibold text-muted">
        Menu
        <Icon name="caretup" className="h-4 w-4" />
      </div>
      <nav
        aria-label="Navigation principale"
        className="mt-2 flex flex-col gap-1"
      >
        {NAV.filter((n) => !n.adminOnly || me.role === "admin").map((n) => {
          // Page courante : l'adresse exacte, ou une sous-page (ex. /projets/3 pour « Projets »).
          const current = n.href === "/" ? pathname === "/" : pathname === n.href || pathname.startsWith(`${n.href}/`);
          return (
            <Link
              key={n.label}
              href={n.href}
              aria-current={current ? "page" : undefined}
              className={`flex items-center gap-3 rounded-full py-[7px] pl-3 pr-2 text-[13px] transition-colors ${
                current ? "bg-side font-semibold text-white" : "font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon name={n.icon} className="h-[18px] w-[18px]" />
              {n.label}
              {current && (
                <span className="ml-auto grid h-6 w-6 place-items-center rounded-full bg-white/15">
                  <Icon name="go" className="h-3.5 w-3.5" />
                </span>
              )}
              {n.badge && alerts > 0 && !current && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#f26b3a] px-1 text-[10.5px] font-bold text-white">
                  {alerts}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex items-center px-1">
        {shown.map((m) => (
          <span
            key={m.id}
            className="-mr-2 rounded-full ring-2 ring-surface"
            title={m.name}
          >
            <Avatar initials={m.initials} seed={m.name} size="h-9 w-9 text-[10.5px]" />
          </span>
        ))}
        {members.length > shown.length && (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-[10.5px] font-bold ring-2 ring-surface">
            +{members.length - shown.length}
          </span>
        )}
      </div>

      <div className="mt-auto rounded-[20px] bg-surface-2 p-4">
        <div className="flex items-center justify-between">
          <b className="text-[13px]">Assistant</b>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-ink">
            <Icon name="sparkle" className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2 rounded-[12px] bg-surface px-3 py-2 text-[11.5px] leading-snug text-ink-2">
          « Qui est disponible demain ? »
        </p>
        <p className="mt-1.5 rounded-[12px] bg-surface px-3 py-2 text-[11.5px] leading-snug text-ink-2">
          « Crée une tâche pour Koffi »
        </p>
        <p className="mt-2 text-right text-[10.5px] text-muted">
          Conversation bientôt disponible
        </p>
      </div>
    </aside>
  );
}
