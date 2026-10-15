"use client";

import { useEffect, useRef, useState } from "react";

import type { Dashboard, Member } from "@/lib/types";

import { Icon } from "./ui";

const STATUS: Record<Member["status"], { icon: string; label: string; dot: string }> = {
  available: { icon: "taskalt", label: "Disponibles", dot: "var(--ok)" },
  meeting: { icon: "users", label: "En réunion", dot: "var(--lav)" },
  mission: { icon: "mission", label: "En mission", dot: "var(--info)" },
  training: { icon: "training", label: "En formation", dot: "var(--risk)" },
  leave: { icon: "leave", label: "En congé", dot: "#9aa0a8" },
};

// Teintes sobres, dans le ton du tableau de bord : cartes grises claires, carte choisie et fiche en vert-citron très léger.
const CARD = "#f4f4ef";
const PICKED = "#eef5d3";
const R = 16; // rayon des courbures (cartes, onglet, fiche)

/** Vue d'ensemble des équipes : cartes des membres à gauche ; la carte choisie se prolonge en onglet jusqu'à la fiche. */
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
      <div className="grid gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Titres des deux colonnes, comme sur le modèle */}
        <div className="flex items-center justify-between gap-2 md:pr-4">
          <h2 className="text-[15px] font-bold">Membres</h2>
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
        <div className="hidden items-center justify-between md:flex">
          <h2 className="text-[15px] font-bold">Fiche du membre</h2>
          <span className="text-[12px] text-muted">
            {teams.available} disponible{teams.available > 1 ? "s" : ""} sur {teams.total}
          </span>
        </div>

        {list.length === 0 ? (
          <p className="py-6 text-center text-[12.5px] text-muted md:col-span-2">Aucun membre pour ce filtre.</p>
        ) : (
          <>
            {/* Cartes des membres */}
            <div className="relative">
              <ul
                ref={listRef}
                onScroll={measure}
                className="flex max-h-[392px] flex-col gap-2.5 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ maskImage: scroll.more ? "linear-gradient(to bottom, #000 calc(100% - 36px), transparent)" : undefined }}
              >
                {list.map((m, i) => {
                  const active = current?.id === m.id;
                  return (
                    <li key={m.id} className={`relative ${active ? "" : "md:mr-4"}`}>
                      <button
                        onClick={() => setPicked(m.id)}
                        aria-pressed={active}
                        className="flex w-full items-center gap-3 py-2.5 pl-2.5 pr-3 text-left"
                        style={{
                          background: active ? PICKED : CARD,
                          borderRadius: active ? `${R}px 0 0 ${R}px` : R,
                          paddingRight: active ? 28 : undefined,
                        }}
                      >
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-[12px] text-[11.5px] font-bold ${
                            active ? "bg-side text-white" : "border border-line bg-surface text-ink-2"
                          }`}
                        >
                          {m.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-[13px] font-semibold">{m.name}</b>
                          <small className="flex items-center gap-1.5 truncate text-[11.5px] text-muted">
                            <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS[m.status].dot }} />
                            <span className="truncate">{m.status_label}</span>
                          </small>
                        </span>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${active ? "bg-surface text-ink" : "border border-line bg-surface text-ink-2"}`}>
                          {m.open_tasks} tâche{m.open_tasks > 1 ? "s" : ""}
                        </span>
                      </button>
                      {/* Courbures inversées de l'onglet, à la jonction avec la fiche (en haut sauf pour la 1re carte, et en bas) */}
                      {active && (
                        <>
                          {i > 0 && (
                            <i
                              className="pointer-events-none absolute right-0 hidden md:block"
                              style={{ top: -R, width: R, height: R, background: `radial-gradient(circle at 0 0, transparent ${R - 0.5}px, ${PICKED} ${R}px)` }}
                            />
                          )}
                          <i
                            className="pointer-events-none absolute right-0 hidden md:block"
                            style={{ bottom: -R, width: R, height: R, background: `radial-gradient(circle at 0 100%, transparent ${R - 0.5}px, ${PICKED} ${R}px)` }}
                          />
                        </>
                      )}
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

            {/* Fiche du membre choisi */}
            {current && <Detail m={current} squareTopLeft={list[0]?.id === current.id} />}
          </>
        )}
      </div>
    </section>
  );
}

function Detail({ m, squareTopLeft }: { m: Member; squareTopLeft: boolean }) {
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
    <div className="p-4" style={{ background: PICKED, borderRadius: squareTopLeft ? `0 ${R}px ${R}px ${R}px` : R }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="block truncate text-[14px] font-bold underline decoration-1 underline-offset-4">{m.name}</b>
          <small className="mt-1 block text-[12px] text-ink-2">
            {m.job_title}
            {m.country ? ` · ${m.country}` : ""}
          </small>
        </div>
        <span className="shrink-0 rounded-full border border-ink/25 px-2.5 py-1 text-[11px] font-semibold text-ink-2">{m.initials}</span>
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
