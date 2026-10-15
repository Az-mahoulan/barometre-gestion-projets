"use client";

import { useState } from "react";

import type { Dashboard, GanttProject } from "@/lib/types";

import { ProjectPicker } from "./ProjectPicker";
import { CardHeader, Icon, TileIcon } from "./ui";

// Couleur de chaque statut : libellé, icône et part dans la barre de répartition.
// Fond pastel de chaque tuile.
const STATUS_BG: Record<string, string> = {
  todo: "#f3f3ee",
  doing: "#dcecfd",
  done: "#d9f1ec",
  review: "#fdf0cf",
  approved: "#e3f6cf",
};

const STATUS_COLOR: Record<string, string> = {
  todo: "#6b7280",
  doing: "#2a56c6",
  done: "#0f766e",
  review: "#d97706",
  approved: "#1f7a4d",
};

export function TaskProgressCard({
  progress,
  projects,
  value,
  onChange,
}: {
  progress: Dashboard["task_progress"];
  projects: GanttProject[];
  value: string;
  onChange: (id: string) => void;
}) {
  const total = Math.max(progress.total, 1);
  // Tâches terminées : faites, en revue ou approuvées (même règle que l'avancement des projets côté serveur).
  const FINISHED = ["done", "review", "approved"];
  const finished = progress.statuses.filter((s) => FINISHED.includes(s.key)).reduce((sum, s) => sum + s.count, 0);
  const finishedPct = Math.round((finished / total) * 100);

  // Deux dispositions : en ligne (tuiles + barre) ou en colonne (liste + anneau) ; le choix est retenu sur l'appareil.
  const [layout, setLayout] = useState<"rows" | "columns">(() => {
    try {
      return localStorage.getItem("progression-disposition") === "columns" ? "columns" : "rows";
    } catch {
      return "rows"; // stockage indisponible : disposition par défaut
    }
  });
  const choose = (l: "rows" | "columns") => {
    setLayout(l);
    try {
      localStorage.setItem("progression-disposition", l);
    } catch {
      /* stockage indisponible */
    }
  };

  return (
    <section className="card flex flex-col" aria-label="Progression des tâches">
      <CardHeader
        title="Progression des tâches"
        aside={
          <div className="flex items-center gap-2">
            <span role="radiogroup" aria-label="Disposition" className="flex rounded-full bg-surface-2 p-1">
              {(
                [
                  ["rows", "rowsview", "En ligne"],
                  ["columns", "donut", "En colonne"],
                ] as const
              ).map(([key, icon, label]) => (
                <button
                  key={key}
                  role="radio"
                  aria-checked={layout === key}
                  aria-label={label}
                  title={label}
                  onClick={() => choose(key)}
                  className={`grid h-7 w-8 place-items-center rounded-full transition-colors ${
                    layout === key ? "bg-surface text-ink shadow-[0_1px_3px_rgba(28,29,34,0.12)]" : "text-muted hover:text-ink"
                  }`}
                >
                  <Icon name={icon} className="h-4 w-4" />
                </button>
              ))}
            </span>
            <ProjectPicker projects={projects} value={value} onChange={onChange} label="Tâches du projet" />
          </div>
        }
      />

      {layout === "rows" ? (
        <>
      <ul className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {progress.statuses.map((s) => (
          <li
            key={s.key}
            className="flex flex-col items-center gap-2.5 rounded-[16px] px-2 py-3 text-center"
            style={{ background: STATUS_BG[s.key] }}
            aria-label={`${s.label} : ${s.count} tâche${s.count > 1 ? "s" : ""}`}
          >
            <span className="text-[12px] font-semibold leading-tight" style={{ color: STATUS_COLOR[s.key] }}>
              {s.label}
            </span>
            <span style={{ color: STATUS_COLOR[s.key] }}>
              <TileIcon name={s.key} className="h-7 w-7" />
            </span>
            <b className="text-[21px] font-bold leading-none tracking-[-0.5px]" style={{ color: STATUS_COLOR[s.key] }}>
              {s.count}
            </b>
          </li>
        ))}
      </ul>

      {/* Barre de flux : la part de chaque statut, de « En attente » à « Approuvé », sur une seule ligne. */}
      <div className="flex flex-1 flex-col justify-center pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12.5px] font-medium text-ink-2">Répartition des {progress.total} tâches</span>
          <span className="text-[12.5px] text-muted">
            <b className="text-[17px] font-semibold text-ink">{finishedPct} %</b> terminées
          </span>
        </div>
        <div
          className="mt-3 flex h-3.5 w-full gap-[3px] overflow-hidden rounded-full"
          role="img"
          aria-label={`Répartition des ${progress.total} tâches : ${progress.statuses.map((s) => `${s.label} ${s.pct} %`).join(", ")}`}
        >
          {progress.statuses
            .filter((s) => s.count > 0)
            .map((s) => (
              <span
                key={s.key}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(s.count / total) * 100}%`, background: STATUS_COLOR[s.key] }}
                title={`${s.label} : ${s.count} (${s.pct} %)`}
              />
            ))}
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2.5 text-center text-[11.5px] sm:grid-cols-5">
          {progress.statuses.map((s) => (
            <li key={s.key}>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted">
                <i className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_COLOR[s.key] }} />
                {s.label}
              </span>
              <b className="mt-0.5 block text-[14px] font-semibold">{s.pct} %</b>
            </li>
          ))}
        </ul>
      </div>
        </>
      ) : (
        <ColumnView progress={progress} finishedPct={finishedPct} />
      )}

        {progress.overdue > 0 && (
          <div className="mt-5 flex items-center gap-3 rounded-[16px] bg-late-soft px-3 py-2.5" role="status">
            {/* Icône intégrée au fond : cercle en pointillé, sans tuile flottante ni ombre. */}
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-late/50 text-late">
              <Icon name="alarm" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-late">
                {progress.overdue} tâche{progress.overdue > 1 ? "s" : ""} en retard
              </p>
              <p className="truncate text-[11.5px] text-ink-2">
                Échéance dépassée · {Math.round((progress.overdue / total) * 100)} % des tâches
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 border-l border-dashed border-late/40 pl-3 text-[12px] font-semibold text-late">
              À relancer
              <Icon name="go" className="h-3.5 w-3.5" />
            </span>
          </div>
        )}
    </section>
  );
}

// Anneau : teintes moyennes (comme le modèle), un segment arrondi par statut, séparés par un petit espace.
const RING: Record<string, string> = {
  todo: "#c9ccd2",
  doing: "#8fb2f4",
  done: "#7dd3c0",
  review: "#f6c85f",
  approved: "#a9dc8b",
};

/** Arc d'anneau (angles en degrés, 0 = en haut, sens horaire). */
function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const pt = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const [x1, y1] = pt(from);
  const [x2, y2] = pt(to);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

/** Disposition en colonne : statuts en liste à gauche, anneau segmenté à droite (total au centre). */
function ColumnView({ progress, finishedPct }: { progress: Dashboard["task_progress"]; finishedPct: number }) {
  const shown = progress.statuses.filter((s) => s.count > 0);
  const total = Math.max(progress.total, 1);
  const SIZE = 230;
  const R = 88;
  const W = 28; // épaisseur
  const CAP = ((W / 2) / R) * (180 / Math.PI); // ce que mange un bout arrondi, en degrés
  const GAP = 3; // espace visible entre deux segments, en degrés
  const MIN = 2 * CAP + GAP + 6; // part minimale à l'écran pour qu'un petit statut reste lisible
  // Parts à l'écran : chaque segment a au moins MIN degrés, les autres se partagent le reste (les % affichés restent exacts).
  const raw = shown.map((s) => (s.count / total) * 360);
  const small = raw.filter((d) => d < MIN).length;
  const bigSum = raw.filter((d) => d >= MIN).reduce((a, d) => a + d, 0);
  const sweeps = raw.map((d) => (d < MIN ? MIN : (d / Math.max(bigSum, 1)) * (360 - small * MIN)));
  const segs = shown.map((s, i) => {
    const from = sweeps.slice(0, i).reduce((a, d) => a + d, 0);
    return { s, from, to: from + sweeps[i] };
  });

  return (
    <div className="mt-2 grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
      <ul className="flex flex-col gap-2">
        {progress.statuses.map((s) => (
          <li key={s.key} className="flex items-center gap-3 rounded-[14px] px-3 py-2" style={{ background: STATUS_BG[s.key] }}>
            <span style={{ color: STATUS_COLOR[s.key] }}>
              <TileIcon name={s.key} className="h-5 w-5" />
            </span>
            <span className="flex-1 text-[12.5px] font-semibold" style={{ color: STATUS_COLOR[s.key] }}>
              {s.label}
            </span>
            <b className="text-[15px] font-bold" style={{ color: STATUS_COLOR[s.key] }}>
              {s.count}
            </b>
            <span className="w-10 text-right text-[11.5px] text-muted">{s.pct} %</span>
          </li>
        ))}
        <li className="mt-1 flex items-baseline justify-between px-1 text-[12.5px] text-muted">
          Terminées (fait, en revue, approuvé)
          <b className="text-[16px] font-semibold text-ink">{finishedPct} %</b>
        </li>
      </ul>

      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto"
        role="img"
        aria-label={`Répartition des ${progress.total} tâches : ${shown.map((s) => `${s.label} ${s.pct} %`).join(", ")}`}
      >
        {segs.map(({ s, from, to }) => {
          const a = from + GAP / 2 + CAP;
          const b = to - GAP / 2 - CAP;
          const mid = (from + to) / 2;
          const lx = SIZE / 2 + R * Math.sin((mid * Math.PI) / 180);
          const ly = SIZE / 2 - R * Math.cos((mid * Math.PI) / 180);
          return (
            <g key={s.key}>
              <title>{`${s.label} : ${s.count} (${s.pct} %)`}</title>
              {b > a ? (
                <path d={arc(SIZE / 2, SIZE / 2, R, a, b)} fill="none" stroke={RING[s.key]} strokeWidth={W} strokeLinecap="round" />
              ) : (
                <circle cx={lx} cy={ly} r={W / 2} fill={RING[s.key]} />
              )}
              {to - from >= MIN + 4 && (
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" className="fill-ink text-[11px] font-semibold">
                  {s.pct}%
                </text>
              )}
            </g>
          );
        })}
        <text x={SIZE / 2} y={SIZE / 2 - 14} textAnchor="middle" className="fill-muted text-[12px]">
          Tâches
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 18} textAnchor="middle" className="fill-ink text-[34px] font-bold" style={{ letterSpacing: "-1px" }}>
          {progress.total}
        </text>
      </svg>
    </div>
  );
}
