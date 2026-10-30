"use client";

import Link from "next/link";
import { useState } from "react";

import { apiPost } from "@/lib/api";
import { shortDate } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { ProjectDetail, ProjectTask } from "@/lib/types";

import { relative } from "../ActivityCard";
import { DeliverablesSection, MilestonesSection } from "../ProjectEntry";
import { AppFrame } from "../AppFrame";
import { Deadline } from "../Deadline";
import { Glass, Ring } from "../ProjectsTable";
import { STATUS_BG, STATUS_COLOR } from "../TaskProgressCard";
import { Avatar, CardHeader, HEALTH_BAR, Icon, TileIcon } from "../ui";

/** Écran d'un projet : en-tête, tâches par statut, jalons et activités, équipe, livrables, dates clés, journal. */
export function ProjectDetailScreen({ id }: { id: string }) {
  const { data, error, refresh } = useApi<ProjectDetail>(`/projects/${id}/`);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const say = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  async function move(task: ProjectTask, status: string) {
    setBusy(task.id);
    try {
      await apiPost(`/tasks/${task.id}/status/`, { status });
      const label = data?.statuses.find((s) => s.key === status)?.label.toLowerCase();
      setToast(`« ${task.title} » : ${label}.`);
      refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3500);
    }
  }

  return (
    <AppFrame asOf={data?.as_of} avatars={data?.avatars}>
      {() =>
        error && !data ? (
          <div className="card text-center">
            <p className="font-medium">{error.status === 404 ? "Ce projet est introuvable ou hors de votre périmètre." : "Impossible de charger le projet."}</p>
            <Link href="/projets" className="btn btn-dark mt-3 inline-flex">
              Retour aux projets
            </Link>
          </div>
        ) : !data ? (
          <p className="card text-muted" role="status">
            Chargement…
          </p>
        ) : (
          <Detail data={data} busy={busy} onMove={move} toast={toast} refresh={refresh} say={say} />
        )
      }
    </AppFrame>
  );
}

function Detail({
  data,
  busy,
  onMove,
  toast,
  refresh,
  say,
}: {
  data: ProjectDetail;
  busy: number | null;
  onMove: (t: ProjectTask, status: string) => void;
  toast: string | null;
  refresh: () => void;
  say: (message: string) => void;
}) {
  const p = data.project;
  const overdue = data.tasks.filter((t) => t.overdue).length;
  const color = HEALTH_BAR[p.health];
  return (
    <div className="flex flex-col gap-4">
      <Link href="/projets" className="inline-flex w-fit items-center gap-1.5 px-1 text-[12.5px] font-semibold text-ink-2 hover:text-ink">
        <Icon name="left" className="h-4 w-4" />
        Tous les projets
      </Link>

      {/* En-tête du projet */}
      <section className="card" aria-label="Projet">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold tracking-[-0.4px]">{p.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
              <Avatar initials={p.owner_initials} seed={p.owner} size="h-[22px] w-[22px] text-[9px]" />
              <span>
                Responsable : <b className="font-semibold text-ink-2">{p.owner}</b>
              </span>
              <span>· {p.country}</span>
              <span>
                · du {shortDate(p.start)} au {shortDate(p.end)}
              </span>
            </p>
            {p.description && <p className="mt-2 max-w-[640px] text-[13px] leading-relaxed text-ink-2">{p.description}</p>}
          </div>
          <Deadline health={p.health} start={p.start} end={p.end} now={data.now} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Avancement">
            <span className="flex items-center gap-2">
              <Ring value={p.progress} color={color} />
              <b className="text-[18px] font-bold">{Math.round(p.progress * 100)} %</b>
            </span>
          </Stat>
          <Stat label="Performance" hint="Avancement réel ÷ avancement attendu à cette date">
            <b className={`text-[18px] font-bold ${p.performance === null ? "text-muted" : p.performance >= 90 ? "text-ok" : p.performance >= 70 ? "text-risk" : "text-late"}`}>
              {p.performance === null ? "–" : `${p.performance} %`}
            </b>
          </Stat>
          <Stat label="Jalons atteints">
            <b className="text-[18px] font-bold">
              {p.milestones_achieved}/{p.milestones_total}
            </b>
          </Stat>
          <Stat label="Livrables remis">
            <span className="flex items-center gap-2">
              <Glass done={p.deliverables_done} total={p.deliverables_total} id={p.id} color={color} still={p.health === "completed"} />
              <b className="text-[18px] font-bold">{p.deliverables_total ? `${p.deliverables_done}/${p.deliverables_total}` : "–"}</b>
            </span>
          </Stat>
          <Stat label="Tâches en retard">
            <b className={`text-[18px] font-bold ${overdue ? "text-late" : "text-ok"}`}>{overdue}</b>
          </Stat>
        </div>
      </section>

      {/* Tâches par statut */}
      <section className="card" aria-label="Tâches du projet">
        <CardHeader title="Tâches" aside={`${data.tasks.length} tâche${data.tasks.length > 1 ? "s" : ""} · ${p.tasks_complete} terminée${p.tasks_complete > 1 ? "s" : ""}`} />
        <div className="grid gap-3 overflow-x-auto md:grid-cols-5">
          {data.statuses.map((s) => {
            const tasks = data.tasks.filter((t) => t.status === s.key);
            return (
              <div key={s.key} className="flex min-w-[200px] flex-col gap-2 rounded-[16px] p-2" style={{ background: STATUS_BG[s.key] }}>
                <div className="flex items-center gap-2 px-1.5 pt-1" style={{ color: STATUS_COLOR[s.key] }}>
                  <TileIcon name={s.key} className="h-4 w-4" />
                  <b className="text-[12.5px] font-bold">{s.label}</b>
                  <span className="ml-auto text-[12px] font-bold">{tasks.length}</span>
                </div>
                {tasks.map((t) => (
                  <TaskCard key={t.id} task={t} statuses={data.statuses} canApprove={data.can_manage} busy={busy === t.id} onMove={onMove} />
                ))}
                {tasks.length === 0 && <p className="px-1.5 pb-1 text-[11.5px] text-muted">Aucune tâche</p>}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_316px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Jalons (saisie pour le responsable du projet) */}
          <MilestonesSection data={data} color={color} refresh={refresh} say={say} />

          {/* Activités */}
          <section className="card" aria-label="Activités">
            <CardHeader title="Activités" aside={`${data.activities.length} activité${data.activities.length > 1 ? "s" : ""}`} />
            <ul className="flex flex-col divide-y divide-line">
              {data.activities.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                  <div className="min-w-[180px] flex-1">
                    <b className="block text-[13px] font-semibold">{a.name}</b>
                    <small className="text-[11.5px] text-muted">
                      {shortDate(a.start)} → {shortDate(a.end)}
                      {a.milestone && ` · jalon « ${a.milestone} »`}
                    </small>
                  </div>
                  <span className="w-[150px]">
                    <span className="block h-1.5 overflow-hidden rounded-full bg-track">
                      <span className="block h-full rounded-full" style={{ width: `${Math.round(a.progress * 100)}%`, background: color }} />
                    </span>
                    <small className="text-[11px] text-muted">
                      {Math.round(a.progress * 100)} % · {a.tasks_complete}/{a.tasks_total} tâches
                    </small>
                  </span>
                </li>
              ))}
              {data.activities.length === 0 && <li className="py-2 text-[12.5px] text-muted">Aucune activité.</li>}
            </ul>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {/* Équipe */}
          <section className="card" aria-label="Équipe du projet">
            <CardHeader title="Équipe" aside={`${data.team.length} personne${data.team.length > 1 ? "s" : ""}`} />
            <ul className="flex flex-col gap-2.5">
              {data.team.map((m) => (
                <li key={m.name} className="flex items-center gap-2.5">
                  <Avatar initials={m.initials} seed={m.name} size="h-9 w-9 text-[11px]" />
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[12.5px] font-bold">
                      {m.name}
                      {m.is_owner && <span className="chip ml-1.5 bg-lime px-1.5 py-0 text-[10px] text-ink">Responsable</span>}
                    </b>
                    <small className="block truncate text-[11px] text-muted">{m.job_title}</small>
                  </div>
                  <small className="shrink-0 text-right text-[11px] text-muted">
                    {m.open_tasks} en cours
                    {m.overdue_tasks > 0 && <b className="block text-late">{m.overdue_tasks} en retard</b>}
                  </small>
                </li>
              ))}
            </ul>
          </section>

          {/* Livrables (saisie pour le responsable du projet) */}
          <DeliverablesSection data={data} refresh={refresh} say={say} />

          {/* Dates clés */}
          {data.key_dates.length > 0 && (
            <section className="card" aria-label="Dates clés">
              <CardHeader title="Dates clés" />
              <ul className="flex flex-col gap-2">
                {data.key_dates.map((k) => (
                  <li key={k.label + k.date} className="flex items-center gap-2.5 text-[12.5px]">
                    <Icon name="event" className="h-4 w-4 text-muted" />
                    <span className="flex-1 font-medium">{k.label}</span>
                    <small className="text-[11px] text-muted">{shortDate(k.date)}</small>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Journal */}
          <section className="card" aria-label="Journal du projet">
            <CardHeader title="Journal" />
            <ul className="flex flex-col gap-3">
              {data.log.map((e) => (
                <li key={e.id} className="flex gap-2.5">
                  <Avatar initials={e.actor_initials} seed={e.actor_name} size="h-7 w-7 text-[9.5px]" />
                  <div className="min-w-0">
                    <p className="text-[12px] leading-snug">{e.message}</p>
                    <small className="text-[11px] text-muted">{relative(e.created_at, new Date(data.now))}</small>
                  </div>
                </li>
              ))}
              {data.log.length === 0 && <li className="text-[12.5px] text-muted">Rien pour l’instant.</li>}
            </ul>
          </section>
        </div>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-side px-4 py-2 text-[12.5px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] bg-surface-2/60 px-3.5 py-3" title={hint}>
      <small className="block text-[11.5px] text-muted">{label}</small>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Carte d'une tâche : responsable, échéance, priorité ; changement de statut si la personne en a le droit. */
function TaskCard({
  task,
  statuses,
  canApprove,
  busy,
  onMove,
}: {
  task: ProjectTask;
  statuses: ProjectDetail["statuses"];
  canApprove: boolean;
  busy: boolean;
  onMove: (t: ProjectTask, status: string) => void;
}) {
  return (
    <article className="rounded-[12px] bg-surface p-2.5 shadow-[0_1px_2px_rgba(28,29,34,0.06)]">
      <div className="flex items-start gap-1.5">
        {task.priority === "h" && (
          <span title="Priorité haute" className="mt-0.5 text-late">
            <Icon name="flag" className="h-3.5 w-3.5" />
          </span>
        )}
        <b className="text-[12.5px] font-semibold leading-snug">{task.title}</b>
      </div>
      {task.activity && <small className="mt-0.5 block truncate text-[11px] text-muted">{task.activity}</small>}
      <div className="mt-2 flex items-center gap-2">
        {task.assignee && <Avatar initials={task.assignee.initials} seed={task.assignee.name} size="h-6 w-6 text-[9px]" />}
        <small className={`text-[11px] ${task.overdue ? "font-semibold text-late" : "text-muted"}`}>
          {task.overdue && <Icon name="clock" className="mr-0.5 inline h-3 w-3 align-[-2px]" />}
          {shortDate(task.due)}
        </small>
        {task.can_edit && (
          <select
            aria-label={`Changer le statut de « ${task.title} »`}
            className="ml-auto h-6 max-w-[98px] rounded-full border border-line bg-surface px-1.5 text-[10.5px] text-ink-2"
            value={task.status}
            disabled={busy}
            onChange={(e) => onMove(task, e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s.key} value={s.key} disabled={s.key === "approved" && !canApprove}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </article>
  );
}
