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

// Anneau : couleurs pures (mêmes tons que l'évolution mois par mois), un segment par statut aux coins à peine arrondis.
const RING: Record<string, string> = {
  todo: "#9aa0a8",
  doing: "#2f6fe0",
  done: "#0f9b8e",
  review: "#e8901c",
  approved: "#1f7a4d",
};

const rad = (deg: number) => (deg * Math.PI) / 180;
// Point à l'angle `a` (0 = en haut, sens horaire) sur le cercle de rayon r.
const at = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.sin(rad(a)), cy - r * Math.cos(rad(a))];

/** Secteur d'anneau plein entre deux angles (rayons r1 < r2). */
function sector(cx: number, cy: number, r1: number, r2: number, from: number, to: number) {
  const large = to - from > 180 ? 1 : 0;
  const [ax, ay] = at(cx, cy, r2, from);
  const [bx, by] = at(cx, cy, r2, to);
  const [c, d] = at(cx, cy, r1, to);
  const [e, f] = at(cx, cy, r1, from);
  return `M ${ax} ${ay} A ${r2} ${r2} 0 ${large} 1 ${bx} ${by} L ${c} ${d} A ${r1} ${r1} 0 ${large} 0 ${e} ${f} Z`;
}

/** Disposition en colonne : statuts en liste à gauche, anneau segmenté à droite avec étiquettes reliées. */
function ColumnView({ progress, finishedPct }: { progress: Dashboard["task_progress"]; finishedPct: number }) {
  const shown = progress.statuses.filter((s) => s.count > 0);
  const total = Math.max(progress.total, 1);
  const VW = 420; // largeur (place pour les étiquettes de part et d'autre)
  const VH = 250;
  const CX = VW / 2;
  const CY = VH / 2;
  const R2 = 92; // rayon extérieur
  const R1 = 58; // rayon intérieur
  const CORNER = 5; // arrondi des coins (petit, comme le modèle)
  const GAP = 2.2; // espace entre segments, en degrés
  const MIN = 9; // part minimale à l'écran, pour qu'un petit statut reste visible (les % restent exacts)

  const raw = shown.map((s) => (s.count / total) * 360);
  const small = raw.filter((d) => d < MIN).length;
  const bigSum = raw.filter((d) => d >= MIN).reduce((a, d) => a + d, 0);
  const sweeps = raw.map((d) => (d < MIN ? MIN : (d / Math.max(bigSum, 1)) * (360 - small * MIN)));
  const segs = shown.map((s, i) => {
    const from = sweeps.slice(0, i).reduce((a, d) => a + d, 0);
    return { s, from, to: from + sweeps[i], mid: from + sweeps[i] / 2 };
  });

  // Étiquettes : à droite pour la moitié droite de l'anneau, à gauche sinon ; écartées si elles se chevauchent.
  type Label = { key: string; side: 1 | -1; ex: number; ey: number; y: number };
  const labels: Label[] = segs.map(({ s, mid }) => {
    const side: 1 | -1 = Math.sin(rad(mid)) >= 0 ? 1 : -1;
    const [ex, ey] = at(CX, CY, R2 + 6, mid);
    const [, y] = at(CX, CY, R2 + 22, mid);
    return { key: s.key, side, ex, ey, y };
  });
  for (const side of [1, -1] as const) {
    const group = labels.filter((l) => l.side === side).sort((a, b) => a.y - b.y);
    for (let i = 1; i < group.length; i++) group[i].y = Math.max(group[i].y, group[i - 1].y + 17);
  }
  const labelOf = (key: string) => labels.find((l) => l.key === key)!;

  return (
    <div className="mt-2 grid items-center gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
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
        width={VW}
        height={VH}
        viewBox={`0 0 ${VW} ${VH}`}
        className="mx-auto h-auto w-full max-w-[420px] overflow-visible"
        role="img"
        aria-label={`Répartition des ${progress.total} tâches : ${shown.map((s) => `${s.label} ${s.pct} %`).join(", ")}`}
      >
        {segs.map(({ s, from, to }) => {
          // Coins arrondis : secteur réduit de CORNER sur chaque bord, puis contour arrondi de la même couleur.
          const inset = (CORNER / R1) * (180 / Math.PI);
          const a = from + GAP / 2 + inset;
          const b = Math.max(a + 0.1, to - GAP / 2 - inset);
          return (
            <path
              key={s.key}
              d={sector(CX, CY, R1 + CORNER, R2 - CORNER, a, b)}
              fill={RING[s.key]}
              stroke={RING[s.key]}
              strokeWidth={CORNER * 2}
              strokeLinejoin="round"
            >
              <title>{`${s.label} : ${s.count} (${s.pct} %)`}</title>
            </path>
          );
        })}

        {/* Liaisons et étiquettes « Statut  xx % » */}
        {segs.map(({ s }) => {
          const l = labelOf(s.key);
          const x2 = CX + l.side * (R2 + 20);
          const x3 = x2 + l.side * 10;
          return (
            <g key={`l-${s.key}`}>
              <polyline points={`${l.ex},${l.ey} ${x2},${l.y} ${x3},${l.y}`} fill="none" stroke="#b9bcc4" strokeWidth="1.2" />
              <circle cx={l.ex} cy={l.ey} r="2.2" fill={RING[s.key]} />
              <text x={x3 + l.side * 4} y={l.y} textAnchor={l.side === 1 ? "start" : "end"} dominantBaseline="central" className="text-[11.5px]">
                <tspan className="fill-ink-2">{s.label}</tspan>
                <tspan className="fill-ink font-bold" dx="5">
                  {s.pct} %
                </tspan>
              </text>
            </g>
          );
        })}

        <text x={CX} y={CY - 12} textAnchor="middle" className="fill-muted text-[12px]">
          Tâches
        </text>
        <text x={CX} y={CY + 17} textAnchor="middle" className="fill-ink text-[30px] font-bold" style={{ letterSpacing: "-1px" }}>
          {progress.total}
        </text>
      </svg>
    </div>
  );
}
