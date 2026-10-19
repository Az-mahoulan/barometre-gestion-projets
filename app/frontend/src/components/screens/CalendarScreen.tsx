"use client";

import Link from "next/link";
import { useState } from "react";

import { longDate, parseDate } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { CalendarMonth, WeekItem } from "@/lib/types";

import { AppFrame, PageHeader } from "../AppFrame";
import { Avatar, Icon } from "../ui";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const WEEKDAYS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];

// Mêmes trois couleurs que la programmation du tableau de bord (réunion, échéance, retard) ; gris quand c'est fait.
// Le type d'élément se lit à son icône.
const KINDS: Record<WeekItem["kind"], { label: string; icon: string }> = {
  event: { label: "Réunion", icon: "users" },
  milestone: { label: "Jalon", icon: "flag" },
  task: { label: "Tâche", icon: "taskalt" },
  activity: { label: "Fin d’activité", icon: "work" },
  deliverable: { label: "Livrable", icon: "upload" },
  keydate: { label: "Date clé", icon: "event" },
  project: { label: "Fin de projet", icon: "folder" },
};
function tone(i: WeekItem) {
  if (i.kind === "event") return { bg: "bg-info-soft", fg: "text-info" };
  if (i.done) return { bg: "bg-surface-2", fg: "text-muted" };
  if (i.late) return { bg: "bg-late-soft", fg: "text-late" };
  return { bg: "bg-risk-soft", fg: "text-risk" };
}

/** Écran « Calendrier » : un mois, tous les éléments datés des projets visibles ; le détail du jour à droite. */
export function CalendarScreen() {
  const [ym, setYm] = useState<{ y: number; m: number } | null>(null);
  const [project, setProject] = useState("");
  const [hidden, setHidden] = useState<WeekItem["kind"][]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const q = new URLSearchParams();
  if (ym) {
    q.set("year", String(ym.y));
    q.set("month", String(ym.m));
  }
  if (project) q.set("project", project);
  const { data, error, refresh } = useApi<CalendarMonth>(`/calendar/?${q}`);

  const shift = (n: number) => {
    if (!data) return;
    const d = new Date(data.year, data.month - 1 + n, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() + 1 });
    setSelected(null);
  };
  const visible = (items: WeekItem[]) => items.filter((i) => !hidden.includes(i.kind));
  const day = data ? (data.days.find((d) => d.date === selected) ?? data.days.find((d) => d.is_today) ?? data.days.find((d) => d.in_month)) : undefined;

  return (
    <AppFrame asOf={data?.as_of} avatars={data?.avatars}>
      {() => (
        <>
          <PageHeader
            title="Calendrier"
            subtitle="Réunions, jalons, échéances, livrables et dates clés de vos projets"
            aside={
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="c-project">
                  Projet
                </label>
                <select id="c-project" className="field h-9 border-line bg-surface" value={project} onChange={(e) => setProject(e.target.value)}>
                  <option value="">Tous les projets</option>
                  {data?.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <span className="flex items-center gap-1 rounded-full bg-surface p-1">
                  <button onClick={() => shift(-1)} aria-label="Mois précédent" className="grid h-7 w-7 place-items-center rounded-full hover:bg-surface-2">
                    <Icon name="left" className="h-4 w-4" />
                  </button>
                  <b className="w-[124px] text-center text-[13px]">{data ? `${MONTHS[data.month - 1]} ${data.year}` : "…"}</b>
                  <button onClick={() => shift(1)} aria-label="Mois suivant" className="grid h-7 w-7 place-items-center rounded-full hover:bg-surface-2">
                    <Icon name="right" className="h-4 w-4" />
                  </button>
                </span>
                <button
                  onClick={() => {
                    setYm(null);
                    setSelected(null);
                  }}
                  className="h-9 rounded-full bg-lime px-3.5 text-[12.5px] font-semibold text-ink"
                >
                  Aujourd’hui
                </button>
              </div>
            }
          />

          {/* Types d'éléments affichés (cliquer pour masquer / afficher) */}
          <div className="mb-3 flex flex-wrap items-center gap-2 px-1" aria-label="Types d’éléments affichés">
            {(Object.keys(KINDS) as WeekItem["kind"][]).map((k) => {
              const on = !hidden.includes(k);
              return (
                <button
                  key={k}
                  aria-pressed={on}
                  onClick={() => setHidden(on ? [...hidden, k] : hidden.filter((h) => h !== k))}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${on ? "bg-surface text-ink" : "bg-transparent text-muted line-through"}`}
                >
                  <Icon name={KINDS[k].icon} className="h-3.5 w-3.5" />
                  {KINDS[k].label}
                </button>
              );
            })}
            <span className="ml-auto flex items-center gap-3 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-full bg-info" /> Réunion
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-full bg-risk" /> Échéance
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-full bg-late" /> En retard
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-full bg-[#c4c6cc]" /> Fait
              </span>
            </span>
          </div>

          {error && !data ? (
            <div className="card text-center">
              <p className="font-medium">Impossible de charger le calendrier.</p>
              <button className="btn btn-dark mt-3" onClick={refresh}>
                Réessayer
              </button>
            </div>
          ) : !data ? (
            <p className="card text-muted" role="status">
              Chargement…
            </p>
          ) : (
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_316px]">
              {/* Grille du mois */}
              <section className="card p-3" aria-label={`${MONTHS[data.month - 1]} ${data.year}`}>
                <div className="grid grid-cols-7 gap-1.5 pb-1.5">
                  {WEEKDAYS.map((w) => (
                    <span key={w} className="px-2 text-[11.5px] font-semibold text-muted">
                      {w}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {data.days.map((d) => {
                    const items = visible(d.items);
                    const isSel = day?.date === d.date;
                    return (
                      <button
                        key={d.date}
                        onClick={() => setSelected(d.date)}
                        aria-pressed={isSel}
                        aria-label={`${longDate(d.date)} : ${items.length} élément${items.length > 1 ? "s" : ""}`}
                        className={`flex min-h-[112px] flex-col gap-1 rounded-[12px] p-1.5 text-left transition-colors ${
                          isSel ? "bg-lime/40 ring-2 ring-ink" : d.in_month ? "bg-surface-2/50 hover:bg-surface-2" : "bg-transparent opacity-50 hover:opacity-80"
                        }`}
                      >
                        <span
                          className={`grid h-6 w-6 place-items-center rounded-full text-[12px] font-bold ${d.is_today ? "bg-ink text-white" : "text-ink-2"}`}
                        >
                          {parseDate(d.date).getDate()}
                        </span>
                        {items.slice(0, 3).map((it, i) => {
                          const t = tone(it);
                          return (
                            <span key={i} className={`flex items-center gap-1 truncate rounded-[6px] px-1.5 py-0.5 text-[10.5px] font-semibold ${t.bg} ${t.fg}`}>
                              <Icon name={KINDS[it.kind].icon} className="h-3 w-3 shrink-0" />
                              <span className={`truncate ${it.done ? "line-through" : ""}`}>
                                {it.time ? `${it.time} ` : ""}
                                {it.title}
                              </span>
                            </span>
                          );
                        })}
                        {items.length > 3 && <span className="px-1.5 text-[10.5px] font-semibold text-muted">+{items.length - 3} autres</span>}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Détail du jour choisi */}
              {day && (
                <section className="card" aria-label="Détail du jour">
                  <b className="block text-[15px] font-bold first-letter:uppercase">{longDate(day.date)}</b>
                  <small className="text-[12px] text-muted">
                    {visible(day.items).length} élément{visible(day.items).length > 1 ? "s" : ""}
                  </small>
                  <ul className="mt-3 flex flex-col divide-y divide-line">
                    {visible(day.items).map((it, i) => {
                      const t = tone(it);
                      return (
                        <li key={i} className="flex gap-2.5 py-2.5">
                          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${t.bg} ${t.fg}`}>
                            <Icon name={KINDS[it.kind].icon} className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <b className={`block text-[12.5px] font-semibold leading-snug ${it.done ? "text-muted line-through" : ""}`}>{it.title}</b>
                            <small className="text-[11px] text-muted">
                              {[it.time, KINDS[it.kind].label, it.late ? "en retard" : it.done ? "fait" : ""].filter(Boolean).join(" · ")}
                            </small>
                            {it.project_id && it.kind !== "event" && (
                              <Link href={`/projets/${it.project_id}`} className="block truncate text-[11px] font-medium text-ink-2 hover:underline">
                                {it.kind === "project" ? "Ouvrir le projet" : it.subtitle}
                              </Link>
                            )}
                            {it.project_id && it.kind === "event" && (
                              <Link href={`/projets/${it.project_id}`} className="block text-[11px] font-medium text-ink-2 hover:underline">
                                Ouvrir le projet
                              </Link>
                            )}
                          </div>
                          {it.people && it.people.length > 0 && (
                            <span className="flex shrink-0 items-start">
                              {it.people.slice(0, 3).map((u, k) => (
                                <span key={u.name} className={`rounded-full ring-2 ring-surface ${k ? "-ml-2" : ""}`}>
                                  <Avatar initials={u.initials} seed={u.name} size="h-6 w-6 text-[9px]" />
                                </span>
                              ))}
                            </span>
                          )}
                        </li>
                      );
                    })}
                    {visible(day.items).length === 0 && <li className="py-2 text-[12.5px] text-muted">Rien de prévu ce jour-là.</li>}
                  </ul>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </AppFrame>
  );
}
