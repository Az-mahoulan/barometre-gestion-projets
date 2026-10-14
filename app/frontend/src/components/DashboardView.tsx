"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiPost } from "@/lib/api";
import { longDate } from "@/lib/format";
import { useCountries, useDashboard, useMe } from "@/lib/hooks";
import type { CriticalItem, Period } from "@/lib/types";

import { ActivityCard } from "./ActivityCard";
import { ConfirmDialog } from "./ConfirmDialog";
import { CriticalCard } from "./CriticalCard";
import { GanttCard } from "./GanttCard";
import { Overview } from "./Overview";
import { ProjectsTable } from "./ProjectsTable";
import { Sidebar } from "./Sidebar";
import { TeamsTable } from "./TeamsTable";
import { TrendCard } from "./TrendCard";
import { WeekCard } from "./WeekCard";

const SCOPE_LABEL = { all: "Tous les projets", owned: "Vos projets", assigned: "Les projets où vous avez des tâches" };

export function DashboardView() {
  const router = useRouter();
  const { me, error: meError } = useMe();
  const countries = useCountries(!!me);

  const [country, setCountry] = useState("");
  const [period, setPeriod] = useState<Period>("year");
  const [week, setWeek] = useState(0);
  const [trendProject, setTrendProject] = useState("");
  const { data, error, loading, refresh } = useDashboard({ country, period, week, trendProject }, !!me);

  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  useEffect(() => {
    if (meError?.status === 401 || meError?.status === 403) router.replace("/login");
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
        const res = await apiPost<{ detail: string }>(`/tasks/${item.task_id}/remind/`);
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

  const remindable = data?.critical_actions.items.filter((i) => i.action === "remind" && i.task_id) ?? [];

  async function remindAll() {
    setBusy("all");
    try {
      await Promise.all(remindable.map((i) => apiPost(`/tasks/${i.task_id}/remind/`)));
      setToast(`${remindable.length} relance${remindable.length > 1 ? "s enregistrées" : " enregistrée"}.`);
      refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
      setConfirmAll(false);
    }
  }

  if (!me || (loading && !data)) {
    return (
      <div className="grid min-h-screen place-items-center text-muted" role="status">
        Chargement…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-medium">Impossible de charger le tableau de bord.</p>
          <p className="mt-1 text-muted">{error.message}</p>
          <button className="btn btn-primary mt-4" onClick={refresh}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar me={me} onLogout={logout} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
          <span className="text-[17px] font-semibold">Baromètre</span>
          <button className="btn btn-sm" onClick={logout}>
            Se déconnecter
          </button>
        </div>

        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.5px]">Tableau de bord</h1>
              <p className="mt-1 text-ink-2">
                {SCOPE_LABEL[data.scope]}, au {longDate(data.as_of)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="f-country">
                Pays
              </label>
              <select
                id="f-country"
                className="field"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setTrendProject("");
                }}
              >
                <option value="">Tous les pays</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="f-period">
                Période
              </label>
              <select id="f-period" className="field" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                <option value="year">Année en cours</option>
                <option value="quarter">Trimestre en cours</option>
                <option value="month">Mois en cours</option>
              </select>
            </div>
          </header>

          <Overview data={data} reminders={remindable.length} onRemind={() => setConfirmAll(true)} />

          <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <GanttCard projects={data.gantt} asOf={data.as_of} />
            <div className="flex min-w-0 flex-col gap-8">
              <WeekCard week={data.week} onOffset={setWeek} />
              <TrendCard trend={data.trend} projects={data.gantt} value={trendProject} onChange={setTrendProject} />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <CriticalCard total={data.critical_actions.total} items={data.critical_actions.items} busy={busy} onAction={runAction} />
            <ActivityCard entries={data.recent_activity} now={data.now} />
          </div>

          <ProjectsTable projects={data.projects} />
          <TeamsTable teams={data.teams} />
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

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center">
        {toast && <span className="rounded-lg bg-ink px-4 py-2.5 text-white">{toast}</span>}
      </div>
    </div>
  );
}
