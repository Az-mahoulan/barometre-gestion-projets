"use client";

import { useState } from "react";
import { arc } from "d3-shape";

import type { Dashboard, GanttProject } from "@/lib/types";

import { ProjectPicker } from "./ProjectPicker";
import { CardHeader, Icon, TileIcon } from "./ui";

// Couleur de chaque statut : libellé, icône et part dans la barre de répartition.
// Fond pastel de chaque tuile.
export const STATUS_BG: Record<string, string> = {
  todo: "#f3f3ee",
  doing: "#dcecfd",
  done: "#d9f1ec",
  review: "#fdf0cf",
  approved: "#e3f6cf",
};

export const STATUS_COLOR: Record<string, string> = {
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
      return localStorage.getItem("progression-disposition") === "rows" ? "rows" : "columns";
    } catch {
      return "columns"; // stockage indisponible : disposition par défaut (diagramme)
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

// Anneau : couleurs pures (mêmes tons que l'évolution mois par mois).
const RING: Record<string, string> = {
  todo: "#9aa0a8",
  doing: "#2f6fe0",
  done: "#0f9b8e",
  review: "#e8901c",
  approved: "#1f7a4d",
};

// Portions géométriquement exactes (d3-shape) : coins arrondis réguliers, espaces de largeur constante (bords parallèles).
const R1 = 60; // rayon intérieur
const R2 = 96; // rayon extérieur
const PAD = 4; // largeur de l'espace entre deux portions, en pixels
const ringArc = arc<{ startAngle: number; endAngle: number }>()
  .innerRadius(R1)
  .outerRadius(R2)
  .cornerRadius(6)
  .padRadius(R2)
  .padAngle(PAD / R2);

/** Disposition en colonne : statuts en liste à gauche, anneau segmenté à droite, étiquettes alignées et reliées. */
function ColumnView({ progress, finishedPct }: { progress: Dashboard["task_progress"]; finishedPct: number }) {
  const shown = progress.statuses.filter((s) => s.count > 0);
  const total = Math.max(progress.total, 1);
  const VW = 460;
  const VH = 300;
  const CX = VW / 2;
  const CY = VH / 2;
  // Angles strictement proportionnels aux nombres de tâches (0 = en haut, sens horaire).
  const sweeps = shown.map((s) => (s.count / total) * 2 * Math.PI);
  const segs = shown.map((s, i) => {
    const startAngle = sweeps.slice(0, i).reduce((a, d) => a + d, 0);
    const endAngle = startAngle + sweeps[i];
    return { s, startAngle, endAngle, mid: (startAngle + endAngle) / 2 };
  });

  // Étiquettes encadrées (statut au-dessus, pourcentage centré dessous), à droite ou à gauche de l'anneau,
  // reliées à leur portion par un trait coudé de sa couleur ; écartées si elles se chevauchent.
  const BW = 74; // largeur d'un cadre
  const BH = 40; // hauteur d'un cadre
  const BX = R2 + 36; // distance du centre au bord intérieur des cadres
  type Label = { key: string; side: 1 | -1; x0: number; y0: number; ty: number };
  const labels: Label[] = segs.map(({ s, mid }) => {
    const [sx, sy] = [Math.sin(mid), -Math.cos(mid)];
    const side: 1 | -1 = sx >= 0 ? 1 : -1;
    return { key: s.key, side, x0: sx * (R2 + 5), y0: sy * (R2 + 5), ty: sy * (R2 + 16) };
  });
  const LIM = CY - BH / 2 - 2;
  for (const side of [1, -1] as const) {
    const group = labels.filter((l) => l.side === side).sort((a, b) => a.ty - b.ty);
    for (let i = 1; i < group.length; i++) group[i].ty = Math.max(group[i].ty, group[i - 1].ty + BH + 8);
    // Si le dernier cadre déborde en bas, on remonte le groupe.
    for (let i = group.length - 1; i >= 0; i--) {
      const max = i === group.length - 1 ? LIM : group[i + 1].ty - BH - 8;
      group[i].ty = Math.min(group[i].ty, max);
    }
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
        viewBox={`0 0 ${VW} ${VH}`}
        className="mx-auto h-auto w-full max-w-[460px]"
        role="img"
        aria-label={`Répartition des ${progress.total} tâches : ${shown.map((s) => `${s.label} ${s.pct} %`).join(", ")}`}
      >
        <g transform={`translate(${CX} ${CY})`}>
          {segs.map(({ s, startAngle, endAngle }) => (
            <path key={s.key} d={ringArc({ startAngle, endAngle }) ?? ""} fill={RING[s.key]}>
              <title>{`${s.label} : ${s.count} (${s.pct} %)`}</title>
            </path>
          ))}

          {segs.map(({ s }) => {
            const l = labelOf(s.key);
            const c = RING[s.key];
            const edge = l.side * BX; // bord du cadre côté anneau
            const bx = l.side === 1 ? BX : -BX - BW;
            // Trait en équerre qui ne traverse jamais l'anneau :
            // - étiquette presque à la hauteur de la portion : trait droit ;
            // - étiquette plus loin du centre (en haut ou en bas) : d'abord vertical, puis horizontal ;
            // - sinon : horizontal jusqu'à dégager l'anneau, vertical, puis horizontal.
            const crossesCenter = (l.y0 < 0) !== (l.ty < 0);
            const yNear = crossesCenter ? 0 : Math.min(Math.abs(l.y0), Math.abs(l.ty));
            const clear = Math.sqrt(Math.max(0, (R2 + 8) ** 2 - yNear ** 2));
            const kx = l.side * Math.min(Math.max(Math.abs(l.x0) + 6, clear), Math.abs(edge) - 6);
            const outward = !crossesCenter && Math.abs(l.ty) > Math.abs(l.y0);
            const route =
              Math.abs(l.ty - l.y0) < 4
                ? `M ${l.x0} ${l.y0} L ${edge} ${l.y0}`
                : outward
                  ? `M ${l.x0} ${l.y0} L ${l.x0} ${l.ty} L ${edge} ${l.ty}`
                  : `M ${l.x0} ${l.y0} L ${kx} ${l.y0} L ${kx} ${l.ty} L ${edge} ${l.ty}`;
            return (
              <g key={`l-${s.key}`}>
                <path
                  d={route}
                  fill="none"
                  stroke={c}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x={bx} y={l.ty - BH / 2} width={BW} height={BH} rx="10" fill="#fff" stroke={c} strokeWidth="1.5" strokeDasharray="3 3" />
                <text x={bx + BW / 2} y={l.ty - 8} textAnchor="middle" dominantBaseline="central" fill={c} className="text-[11px] font-semibold">
                  {s.label}
                </text>
                <text x={bx + BW / 2} y={l.ty + 9} textAnchor="middle" dominantBaseline="central" fill={c} className="text-[14px] font-bold">
                  {s.pct} %
                </text>
              </g>
            );
          })}

          <text y={-12} textAnchor="middle" className="fill-muted text-[12px]">
            Tâches
          </text>
          <text y={18} textAnchor="middle" className="fill-ink text-[30px] font-bold" style={{ letterSpacing: "-1px" }}>
            {progress.total}
          </text>
        </g>
      </svg>
    </div>
  );
}
