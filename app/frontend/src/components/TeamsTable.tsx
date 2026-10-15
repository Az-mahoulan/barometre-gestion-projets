"use client";

import { useEffect, useRef, useState } from "react";

import type { Dashboard, Member } from "@/lib/types";

import { Avatar, Icon, TONES, type Tone } from "./ui";

const STATUS: Record<Member["status"], { tone: Tone; icon: string; bg: string; label: string }> = {
  available: { tone: "mint", icon: "taskalt", bg: "bg-ok-soft", label: "Disponibles" },
  meeting: { tone: "lav", icon: "users", bg: "bg-lav-soft", label: "En réunion" },
  mission: { tone: "sky", icon: "mission", bg: "bg-info-soft", label: "En mission" },
  training: { tone: "sand", icon: "training", bg: "bg-risk-soft", label: "En formation" },
  leave: { tone: "gray", icon: "leave", bg: "bg-surface-2", label: "En congé" },
};

/** Vue d'ensemble des équipes : liste des membres à gauche, fiche du membre choisi à droite (même teinte, d'un seul tenant). */
export function TeamsTable({ teams }: { teams: Dashboard["teams"] }) {
  const [filter, setFilter] = useState<Member["status"] | "">("");
  const [picked, setPicked] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  // Défilement de la liste : petit curseur discret + fondu en bas tant qu'il reste des membres à voir.
  const listRef = useRef<HTMLUListElement>(null);
  const [scroll, setScroll] = useState({ show: false, top: 0, more: false });
  const measure = () => {
    const el = listRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const next = { show: max > 2, top: max > 0 ? el.scrollTop / max : 0, more: el.scrollTop < max - 2 };
    setScroll((cur) => (cur.show === next.show && cur.top === next.top && cur.more === next.more ? cur : next));
  };
  useEffect(() => {
    measure();
  });

  const list = teams.members.filter((m) => !filter || m.status === filter);
  const current = list.find((m) => m.id === picked) ?? list[0];
  const counts = (Object.keys(STATUS) as Member["status"][]).map((k) => [k, teams.members.filter((m) => m.status === k).length] as const);

  return (
    <section className="card" aria-label="Vue d’ensemble des équipes">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold">Vue d’ensemble des équipes</h2>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-muted">
            {teams.available} disponible{teams.available > 1 ? "s" : ""} sur {teams.total}
          </span>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenu(!menu)}
              aria-haspopup="listbox"
              aria-expanded={menu}
              className="flex h-8 items-center gap-1.5 rounded-full bg-side pl-3.5 pr-2.5 text-[12px] font-semibold text-white"
            >
              {filter ? STATUS[filter].label : "Tous"}
              <Icon name={menu ? "caretup" : "caretdown"} className="h-4 w-4" />
            </button>
            {menu && (
              <ul role="listbox" className="absolute right-0 top-[calc(100%+6px)] z-30 w-[190px] rounded-[14px] border border-line bg-surface p-1 shadow-[0_12px_28px_-14px_rgba(28,29,34,0.3)]">
                {[["", "Tous", teams.members.length] as const, ...counts.map(([k, n]) => [k, STATUS[k].label, n] as const)].map(([k, label, n]) => (
                  <li
                    key={k || "all"}
                    role="option"
                    aria-selected={filter === k}
                    onClick={() => {
                      setFilter(k as Member["status"] | "");
                      setMenu(false);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-[10px] px-3 py-1.5 text-[12.5px] ${filter === k ? "bg-lime font-semibold" : "hover:bg-surface-2"}`}
                  >
                    {label}
                    <span className="text-[11px] text-muted">{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] text-muted">Aucun membre pour ce filtre.</p>
      ) : (
        <div className="grid gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Liste des membres */}
          <div className="relative">
          <ul
            ref={listRef}
            onScroll={measure}
            className="flex max-h-[372px] flex-col gap-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maskImage: scroll.more ? "linear-gradient(to bottom, #000 calc(100% - 36px), transparent)" : undefined }}
          >
            {list.map((m) => {
              const st = STATUS[m.status];
              const active = current?.id === m.id;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => setPicked(m.id)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 py-2.5 pl-2.5 text-left transition-colors ${
                      active ? `${st.bg} rounded-l-[16px] pr-5 md:-mr-px` : "rounded-[16px] pr-2.5 hover:bg-surface-2"
                    }`}
                  >
                    <Avatar initials={m.initials} size="h-9 w-9 text-[11px]" />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[13px] font-semibold">{m.name}</b>
                      <small className="block truncate text-[11.5px] text-muted">
                        {m.status_label} · {m.place_label}
                      </small>
                    </span>
                    <span className={`chip shrink-0 ${active ? "bg-surface text-ink-2" : TONES[st.tone]}`}>
                      {m.open_tasks} tâche{m.open_tasks > 1 ? "s" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {scroll.show && (
            <span className="pointer-events-none absolute inset-y-1 -left-2.5 w-[3px]" aria-hidden="true">
              <span className="absolute h-4 w-full rounded-full bg-[#c9cac3]" style={{ top: `calc(${scroll.top} * (100% - 16px))` }} />
            </span>
          )}
          </div>

          {/* Fiche du membre choisi, dans la teinte de sa ligne */}
          {current && <Detail m={current} first={list[0]?.id === current.id} />}
        </div>
      )}
    </section>
  );
}

function Detail({ m, first }: { m: Member; first: boolean }) {
  const st = STATUS[m.status];
  const rows: [string, React.ReactNode][] = [
    ["Statut", m.reason ? `${m.status_label} · ${m.reason.replace(/\.$/, "")}` : m.status_label],
    ["Lieu", m.place_label],
    [
      "Tâches",
      <>
        {m.open_tasks} en cours
        {m.overdue_tasks > 0 && <b className="font-semibold text-late"> · {m.overdue_tasks} en retard</b>}
      </>,
    ],
    ["Pays", m.country || "—"],
  ];
  return (
    <div className={`${st.bg} rounded-[18px] p-4 ${first ? "md:rounded-tl-none" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="block truncate text-[14px] font-bold underline decoration-1 underline-offset-4">{m.name}</b>
          <small className="mt-1 block text-[12px] text-ink-2">
            {m.job_title}
            {m.country ? ` · ${m.country}` : ""}
          </small>
        </div>
        <Avatar initials={m.initials} size="h-11 w-11 text-[13px] ring-2 ring-surface" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip bg-surface text-ink-2">
          <Icon name={st.icon} className="h-3.5 w-3.5" />
          {m.status_label}
        </span>
        <span className="chip bg-surface text-ink-2">
          <Icon name="pin" className="h-3.5 w-3.5" />
          {m.place_label}
        </span>
        {m.overdue_tasks > 0 && <span className="chip bg-surface text-late">{m.overdue_tasks} en retard</span>}
      </div>

      <dl className="mt-4 grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[12.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
