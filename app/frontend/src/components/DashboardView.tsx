"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiPost } from "@/lib/api";
import { longDate } from "@/lib/format";
import { useCountries, useDashboard, useMe } from "@/lib/hooks";
import type { CriticalItem, Me, Period } from "@/lib/types";

import { ActivityCard } from "./ActivityCard";
import { AvatarsProvider } from "./Avatar";
import { AssistantCard, buildSummary } from "./AssistantCard";
import { ConfirmDialog } from "./ConfirmDialog";
import { CriticalCard } from "./CriticalCard";
import { GanttCard } from "./GanttCard";
import { MilestoneProgressCard } from "./MilestoneProgressCard";
import { TimelineCard } from "./TimelineCard";
import { WeekActivitiesCard } from "./WeekActivitiesCard";
import { KpiRow } from "./KpiRow";
import { ProjectsTable } from "./ProjectsTable";
import { orderCards, SortableColumn } from "./SortableColumn";
import { StickySide } from "./StickySide";
import { Sidebar } from "./Sidebar";
import { TaskProgressCard } from "./TaskProgressCard";
import { TeamsTable } from "./TeamsTable";
import { Topbar } from "./Topbar";
import { TrendCard } from "./TrendCard";
import { WeekCard } from "./WeekCard";

const SCOPE_LABEL = { all: "Tous les projets", owned: "Vos projets", assigned: "Projets où vous avez des tâches" };

export function DashboardView() {
  const router = useRouter();
  const { me: loadedMe, error: meError, waking } = useMe();
  // Profil mis à jour localement (changement d'avatar) sans recharger la page.
  const [meUpdate, setMeUpdate] = useState<Me | null>(null);
  const me = meUpdate ?? loadedMe;
  const countries = useCountries(!!me);

  const [country, setCountry] = useState("");
  const [period, setPeriod] = useState<Period>("year");
  const [week, setWeek] = useState(0);
  const [trendProject, setTrendProject] = useState("");
  const [tasksProject, setTasksProject] = useState("");
  const { data, error, loading, refresh } = useDashboard(
    { country, period, week, trendProject, tasksProject },
    !!me,
  );

  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  // Disposition personnelle des cartes (glisser-déposer) : appliquée tout de suite, puis enregistrée sur le profil.
  const layout = me?.dashboard_layout ?? {};
  async function saveLayout(next: Me["dashboard_layout"]) {
    if (!me) return;
    setMeUpdate({ ...me, dashboard_layout: next });
    try {
      setMeUpdate(await apiPost<Me>("/auth/me/layout/", next));
    } catch {
      setToast("La nouvelle disposition n’a pas pu être enregistrée.");
    }
  }

  useEffect(() => {
    if (meError?.status === 401 || meError?.status === 403)
      router.replace("/login");
  }, [meError, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function logout() {
    await apiPost("/auth/logout/");
    router.replace("/login");
  }

  async function runAction(item: CriticalItem) {
    if (!item.task_id) return;
    const key = `${item.kind}-${item.task_id ?? item.project_id}-${item.title}`;
    setBusy(key);
    try {
      if (item.action === "remind") {
        const res = await apiPost<{ detail: string }>(
          `/tasks/${item.task_id}/remind/`,
        );
        setToast(res.detail);
      } else if (item.action === "approve") {
        await apiPost(`/tasks/${item.task_id}/status/`, { status: "approved" });
        setToast(`« ${item.title} » approuvée.`);
      }
      refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const remindable =
    data?.critical_actions.items.filter(
      (i) => i.action === "remind" && i.task_id,
    ) ?? [];

  async function remindAll() {
    setBusy("all");
    try {
      await Promise.all(
        remindable.map((i) => apiPost(`/tasks/${i.task_id}/remind/`)),
      );
      setToast(
        `${remindable.length} relance${remindable.length > 1 ? "s enregistrées" : " enregistrée"}.`,
      );
      refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
      setConfirmAll(false);
    }
  }

  if (meError && meError.status !== 401 && meError.status !== 403) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-medium">Le serveur ne répond pas.</p>
          <p className="mt-1 text-sm text-muted">{meError.message}</p>
          <button
            className="btn btn-dark mt-4"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!me || (loading && !data)) {
    return (
      <div
        className="grid min-h-screen place-items-center p-6 text-center text-muted"
        role="status"
      >
        {waking ? (
          <div>
            <p className="font-medium text-ink">Démarrage du serveur…</p>
            <p className="mt-1 text-sm">
              Après une période d’inactivité, cela prend environ une minute. La
              page s’affichera toute seule.
            </p>
          </div>
        ) : (
          "Chargement…"
        )}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-medium">
            Impossible de charger le tableau de bord.
          </p>
          <p className="mt-1 text-sm text-muted">{error.message}</p>
          <button className="btn btn-dark mt-4" onClick={refresh}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    // Cadre blanc unique (barre latérale + barre du haut) ; le contenu s'y encastre dans un panneau arrondi.
    <AvatarsProvider value={{ ...data.avatars, [me.name]: me.avatar }}>
    <div className="min-h-screen bg-surface">
      <div className="flex min-h-screen bg-surface p-2">
        <Sidebar
          me={me}
          alerts={data.critical_actions.total}
          subtitle={`${longDate(data.as_of).replace(/^./, (c) => c.toUpperCase())} · ${SCOPE_LABEL[data.scope]}`}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          <Topbar
            me={me}
            countries={countries}
            country={country}
            period={period}
            alerts={data.critical_actions.total}
            onCountry={(c) => {
              setCountry(c);
              setTrendProject("");
              setTasksProject("");
            }}
            onPeriod={setPeriod}
            onLogout={logout}
            onMeChange={(updated) => {
              setMeUpdate(updated);
              refresh();
            }}
          />

          {/* Indicateurs sur toute la largeur, puis deux colonnes : la colonne de droite commence sous eux (forme en L). */}
          <div className="grid flex-1 content-start gap-4 rounded-[22px] bg-bg p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_316px]">
            <div className="min-w-0 xl:col-span-2">
              <KpiRow kpis={data.kpis} />
            </div>
            {/*
              Ordre par défaut, pensé pour un gestionnaire de projet (chacun peut ensuite le changer) :
              colonne principale, du général au détail puis au recul — état du portefeuille, exécution en cours
              (jalons, activités, tâches), plan (dépendances, calendrier), tendance, ressources ;
              colonne de droite, de l'urgent au contexte — synthèse, actions à mener, agenda, fil d'activité.
            */}
            <SortableColumn
              className="flex min-w-0 flex-col gap-4"
              cards={orderCards(
                [
                  { id: "projects", label: "Vue d’ensemble des projets", node: <ProjectsTable projects={data.projects} now={data.now} /> },
                  {
                    id: "milestones",
                    label: "Progression des jalons et activités de la semaine",
                    node: (
                      // Progression des jalons et activités de la semaine côte à côte (même hauteur : celle des activités).
                      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_316px]">
                        <MilestoneProgressCard projects={data.gantt} asOf={data.as_of} />
                        <WeekActivitiesCard projects={data.gantt} asOf={data.as_of} />
                      </div>
                    ),
                  },
                  {
                    id: "tasks",
                    label: "Progression des tâches",
                    node: (
                      <TaskProgressCard progress={data.task_progress} projects={data.gantt} value={tasksProject} onChange={setTasksProject} />
                    ),
                  },
                  { id: "gantt", label: "Gantt des jalons", node: <GanttCard projects={data.gantt} asOf={data.as_of} /> },
                  { id: "timeline", label: "Chronologie des projets", node: <TimelineCard projects={data.gantt} asOf={data.as_of} /> },
                  {
                    id: "trend",
                    label: "Évolution",
                    node: <TrendCard trend={data.trend} projects={data.gantt} value={trendProject} onChange={setTrendProject} />,
                  },
                  { id: "teams", label: "Vue d’ensemble des équipes", node: <TeamsTable teams={data.teams} /> },
                ],
                layout.main,
              )}
              onReorder={(ids) => saveLayout({ ...layout, main: ids })}
            />

            <StickySide>
            <SortableColumn
              className="flex min-w-0 flex-col gap-4"
              cards={orderCards(
                [
                  {
                    id: "assistant",
                    label: "Synthèse",
                    node: (
                      <AssistantCard
                        summary={buildSummary(data)}
                        canRemind={remindable.length > 0}
                        reminders={remindable.length}
                        onRemind={() => setConfirmAll(true)}
                      />
                    ),
                  },
                  {
                    id: "critical",
                    label: "Actions critiques",
                    node: (
                      <CriticalCard total={data.critical_actions.total} counts={data.critical_actions.counts} items={data.critical_actions.items} busy={busy} onAction={runAction} />
                    ),
                  },
                  {
                    id: "week",
                    label: "Programmation",
                    node: <WeekCard week={data.week} asOf={data.as_of} projects={data.gantt} onOffset={setWeek} />,
                  },
                  { id: "activity", label: "Activité récente", node: <ActivityCard entries={data.recent_activity} now={data.now} /> },
                ],
                layout.side,
              )}
              onReorder={(ids) => saveLayout({ ...layout, side: ids })}
            />
            </StickySide>
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={confirmAll}
        title="Relancer les responsables ?"
        message={`${remindable.length} relance${remindable.length > 1 ? "s seront enregistrées" : " sera enregistrée"} au journal du projet. Rien d’autre n’est modifié.`}
        confirmLabel="Relancer"
        busy={busy === "all"}
        onConfirm={remindAll}
        onCancel={() => setConfirmAll(false)}
      />

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center"
      >
        {toast && (
          <span className="rounded-full bg-side px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
            {toast}
          </span>
        )}
      </div>
    </div>
    </AvatarsProvider>
  );
}
