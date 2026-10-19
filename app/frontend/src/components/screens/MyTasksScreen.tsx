"use client";

import Link from "next/link";
import { useState } from "react";

import { apiPost } from "@/lib/api";
import { parseDate, shortDate } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { MyTask, MyTasks } from "@/lib/types";

import { AppFrame, PageHeader } from "../AppFrame";
import { STATUS_BG, STATUS_COLOR } from "../TaskProgressCard";
import { Avatar, Icon, TileIcon } from "../ui";

type Group = "late" | "today" | "week" | "later" | "done";
const GROUPS: { key: Group; label: string; hint: string; tone: string }[] = [
  { key: "late", label: "En retard", hint: "Échéance dépassée", tone: "text-late" },
  { key: "today", label: "Aujourd’hui", hint: "À terminer aujourd’hui", tone: "text-risk" },
  { key: "week", label: "Cette semaine", hint: "D’ici dimanche", tone: "text-ink" },
  { key: "later", label: "Plus tard", hint: "Après cette semaine", tone: "text-ink-2" },
  { key: "done", label: "Terminées", hint: "Faites, en revue ou approuvées", tone: "text-ok" },
];

/** Classement d'une tâche selon son échéance (les tâches terminées à part). */
function groupOf(t: MyTask, asOf: string): Group {
  if (t.complete) return "done";
  if (t.overdue) return "late";
  if (t.due === asOf) return "today";
  const today = parseDate(asOf);
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + ((7 - today.getDay()) % 7));
  return parseDate(t.due) <= sunday ? "week" : "later";
}

/** Écran « Mes tâches » : ses tâches (ou celles de ses projets) classées par urgence, statut modifiable sur place. */
export function MyTasksScreen() {
  const [scope, setScope] = useState<"mine" | "projects" | null>(null);
  // Premier affichage : ses propres tâches ; un responsable sans tâche à son nom passe ensuite sur celles de ses projets.
  const [first, setFirst] = useState<MyTasks | null>(null);
  const auto = first && first.mine_count === 0 && first.can_see_projects ? "projects" : "mine";
  const { data, error, refresh } = useApi<MyTasks>(`/my-tasks/?scope=${scope ?? auto}`);
  if (!first && data) setFirst(data);
  const [project, setProject] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function move(t: MyTask, status: string) {
    setBusy(t.id);
    try {
      await apiPost(`/tasks/${t.id}/status/`, { status });
      setToast(`« ${t.title} » : ${data?.statuses.find((s) => s.key === status)?.label.toLowerCase()}.`);
      refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3500);
    }
  }

  const tasks = (data?.tasks ?? []).filter((t) => (!project || String(t.project.id) === project) && (!urgentOnly || t.priority === "h"));
  const projects = [...new Map((data?.tasks ?? []).map((t) => [t.project.id, t.project.name])).entries()];
  const grouped = (g: Group) => (data ? tasks.filter((t) => groupOf(t, data.as_of) === g) : []);
  const current = data?.scope ?? "mine";

  return (
    <AppFrame asOf={data?.as_of} avatars={data?.avatars}>
      {() => (
        <>
          <PageHeader
            title={current === "projects" ? "Tâches de mes projets" : "Mes tâches"}
            subtitle={
              data
                ? `${tasks.filter((t) => !t.complete).length} à faire · ${grouped("late").length} en retard`
                : " "
            }
            aside={
              <div className="flex flex-wrap items-center gap-2">
                {data?.can_see_projects && (
                  <span role="radiogroup" aria-label="Tâches affichées" className="flex rounded-full bg-surface p-1">
                    {(
                      [
                        ["mine", `À mon nom (${data.mine_count})`],
                        ["projects", "De mes projets"],
                      ] as const
                    ).map(([k, label]) => (
                      <button
                        key={k}
                        role="radio"
                        aria-checked={current === k}
                        onClick={() => setScope(k)}
                        className={`rounded-full px-3 py-1 text-[12px] font-semibold ${current === k ? "bg-side text-white" : "text-ink-2 hover:text-ink"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </span>
                )}
                <label className="sr-only" htmlFor="t-project">
                  Projet
                </label>
                <select id="t-project" className="field h-9 border-line bg-surface" value={project} onChange={(e) => setProject(e.target.value)}>
                  <option value="">Tous les projets</option>
                  {projects.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  aria-pressed={urgentOnly}
                  onClick={() => setUrgentOnly(!urgentOnly)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold ${urgentOnly ? "bg-late-soft text-late" : "bg-surface text-ink-2 hover:text-ink"}`}
                >
                  <Icon name="flag" className="h-4 w-4" />
                  Priorité haute
                </button>
              </div>
            }
          />

          {error && !data ? (
            <div className="card text-center">
              <p className="font-medium">Impossible de charger les tâches.</p>
              <button className="btn btn-dark mt-3" onClick={refresh}>
                Réessayer
              </button>
            </div>
          ) : !data ? (
            <p className="card text-muted" role="status">
              Chargement…
            </p>
          ) : (
            <>
              {/* Compteurs par urgence */}
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {GROUPS.map((g) => (
                  <a key={g.key} href={`#groupe-${g.key}`} onClick={() => g.key === "done" && setShowDone(true)} className="card block py-3 hover:shadow-[0_6px_20px_-12px_rgba(28,29,34,0.35)]">
                    <small className="block text-[11.5px] text-muted">{g.label}</small>
                    <b className={`text-[22px] font-bold ${grouped(g.key).length ? g.tone : "text-muted"}`}>{grouped(g.key).length}</b>
                  </a>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                {GROUPS.map((g) => {
                  const list = grouped(g.key);
                  if (g.key === "done") {
                    return (
                      <section key={g.key} id={`groupe-${g.key}`} className="card" aria-label={g.label}>
                        <button onClick={() => setShowDone(!showDone)} aria-expanded={showDone} className="flex w-full items-center justify-between text-left">
                          <span>
                            <b className="text-[15px] font-bold">{g.label}</b> <span className="text-[12px] text-muted">· {list.length}</span>
                          </span>
                          <Icon name={showDone ? "caretup" : "caretdown"} className="h-4 w-4 text-muted" />
                        </button>
                        {showDone && <TaskList tasks={list} data={data} busy={busy} onMove={move} />}
                      </section>
                    );
                  }
                  return (
                    <section key={g.key} id={`groupe-${g.key}`} className="card" aria-label={g.label}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <b className={`text-[15px] font-bold ${g.key === "late" && list.length ? "text-late" : ""}`}>{g.label}</b>
                        <span className="text-[12px] text-muted">
                          {g.hint} · {list.length}
                        </span>
                      </div>
                      {list.length ? (
                        <TaskList tasks={list} data={data} busy={busy} onMove={move} />
                      ) : (
                        <p className="py-2 text-[12.5px] text-muted">Rien ici.</p>
                      )}
                    </section>
                  );
                })}
              </div>
            </>
          )}

          {toast && (
            <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-side px-4 py-2 text-[12.5px] font-medium text-white shadow-lg">
              {toast}
            </div>
          )}
        </>
      )}
    </AppFrame>
  );
}

function TaskList({ tasks, data, busy, onMove }: { tasks: MyTask[]; data: MyTasks; busy: number | null; onMove: (t: MyTask, s: string) => void }) {
  return (
    <ul className="mt-1 flex flex-col divide-y divide-line">
      {tasks.map((t) => (
        <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: STATUS_BG[t.status], color: STATUS_COLOR[t.status] }} title={t.status_label}>
            <TileIcon name={t.status} className="h-4 w-4" />
          </span>
          <div className="min-w-[200px] flex-1">
            <b className="flex items-center gap-1.5 text-[13px] font-semibold">
              {t.priority === "h" && (
                <span title="Priorité haute" className="text-late">
                  <Icon name="flag" className="h-3.5 w-3.5" />
                </span>
              )}
              {t.title}
            </b>
            <small className="text-[11.5px] text-muted">
              <Link href={`/projets/${t.project.id}`} className="font-medium text-ink-2 hover:underline">
                {t.project.name}
              </Link>
              {t.activity && ` · ${t.activity}`}
            </small>
          </div>
          {data.scope === "projects" && t.assignee && (
            <span className="flex w-[150px] items-center gap-2 text-[12px] text-ink-2">
              <Avatar initials={t.assignee.initials} seed={t.assignee.name} size="h-6 w-6 text-[9px]" />
              <span className="truncate">{t.assignee.name}</span>
            </span>
          )}
          <span className={`w-[78px] text-[12px] ${t.overdue ? "font-semibold text-late" : "text-ink-2"}`}>
            {t.overdue && <Icon name="clock" className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />}
            {shortDate(t.due)}
          </span>
          {t.can_edit ? (
            <select
              aria-label={`Changer le statut de « ${t.title} »`}
              className="field h-8 w-[130px] border-line text-[12px]"
              value={t.status}
              disabled={busy === t.id}
              onChange={(e) => onMove(t, e.target.value)}
            >
              {data.statuses.map((s) => (
                <option key={s.key} value={s.key} disabled={s.key === "approved" && !t.can_approve}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="w-[130px] text-[12px] text-muted">{t.status_label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
