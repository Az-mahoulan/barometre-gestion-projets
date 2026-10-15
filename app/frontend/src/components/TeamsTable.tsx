"use client";

import { useEffect, useRef, useState } from "react";

import type { Dashboard, Member } from "@/lib/types";

import { Icon, TONES, toneFor, type Tone } from "./ui";

const STATUS: Record<Member["status"], { icon: string; label: string; tone: Tone }> = {
  available: { icon: "taskalt", label: "Disponibles", tone: "mint" },
  meeting: { icon: "users", label: "En réunion", tone: "lav" },
  mission: { icon: "mission", label: "En mission", tone: "sky" },
  training: { icon: "training", label: "En formation", tone: "sand" },
  leave: { icon: "leave", label: "En congé", tone: "gray" },
};

// Fonds blancs sur le gris de la page (comme la vue d'ensemble des projets) ; seuls les éléments importants sont colorés.
const CARD = "var(--surface)";
const PICKED = "var(--surface)";
const R = 18; // rayon des courbures (cartes, onglet, fiche)

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
    <section aria-label="Vue d’ensemble des équipes">
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
                            active ? "bg-side text-white" : TONES[toneFor(m.initials)]
                          }`}
                        >
                          {m.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-[13px] font-semibold">{m.name}</b>
                          <span className={`chip mt-1 !py-0.5 !text-[10.5px] ${TONES[STATUS[m.status].tone]}`}>
                            <Icon name={STATUS[m.status].icon} className="h-3 w-3" />
                            {m.status_label}
                          </span>
                        </span>
                        <span className="shrink-0 text-right text-[11px] leading-tight text-muted">
                          <b className="block text-[12.5px] font-semibold text-ink">{m.open_tasks}</b>
                          tâche{m.open_tasks > 1 ? "s" : ""}
                          {m.overdue_tasks > 0 && <b className="block font-semibold text-late">{m.overdue_tasks} en retard</b>}
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
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[12px] text-[12.5px] font-bold ${TONES[toneFor(m.initials)]}`}>{m.initials}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={`chip ${TONES[st.tone]}`}>
          <Icon name={st.icon} className="h-3.5 w-3.5" />
          {m.status_label}
        </span>
        <span className="chip bg-surface-2 text-ink-2">
          <Icon name="pin" className="h-3.5 w-3.5" />
          {m.place_label}
        </span>
        {m.overdue_tasks > 0 && <span className="chip bg-late-soft text-late">{m.overdue_tasks} en retard</span>}
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
