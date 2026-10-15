import { shortDate } from "@/lib/format";
import type { ProjectRow } from "@/lib/types";

import { Avatar, HealthChip, HEALTH_BAR, Tile, type Tone } from "./ui";

const TILE_TONES: Tone[] = ["lav", "rose", "sky", "sand", "mint", "peach"];

function perfClass(v: number) {
  return v >= 90 ? "text-ok" : v >= 70 ? "text-risk" : "text-late";
}

/** Anneau d'avancement (part des tâches avancées). */
function Ring({ value, color }: { value: number; color: string }) {
  const c = 2 * Math.PI * 15;
  return (
    <svg viewBox="0 0 36 36" className="h-9 w-9 shrink-0" aria-hidden="true">
      <circle cx="18" cy="18" r="15" fill="none" stroke="var(--track)" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${Math.max(0.01, value) * c} ${c}`}
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
}

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  return (
    <section aria-label="Vue d’ensemble des projets">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[17px] font-bold">Vue d’ensemble des projets</h2>
        <span className="text-[12.5px] text-muted" title="Performance = avancement réel ÷ avancement attendu à cette date">
          {projects.length} projets · performance = avancement réel ÷ attendu
        </span>
      </div>

      {projects.length === 0 && <p className="card text-muted">Aucun projet pour ces filtres.</p>}

      <ul className="flex flex-col gap-3">
        {projects.map((p, i) => (
          <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[18px] bg-surface px-[18px] py-3.5">
            <div className="flex min-w-[200px] flex-1 items-center gap-3">
              <Tile icon="project" tone={TILE_TONES[i % TILE_TONES.length]} />
              <div className="min-w-0">
                <b className="block truncate text-[14px] font-bold">{p.name}</b>
                <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                  <Avatar initials={p.owner_initials} size="h-[18px] w-[18px] text-[8.5px]" />
                  <span className="truncate">
                    {p.owner} · {p.country}
                  </span>
                </span>
              </div>
            </div>

            <div className="w-[150px] text-[12px] text-muted" title={`${shortDate(p.start)} → ${shortDate(p.end)}`}>
              Prochain jalon
              {p.next_milestone ? (
                <b className={`block truncate text-[13px] ${p.next_milestone.overdue ? "text-late" : "text-ink"}`}>
                  {p.next_milestone.name}, {p.next_milestone.overdue ? "dépassé" : shortDate(p.next_milestone.date)}
                </b>
              ) : (
                <b className="block text-[13px] text-ink">–</b>
              )}
            </div>

            <div className="w-[78px] text-[12px] text-muted">
              Performance
              <b className={`block text-[13px] ${p.performance === null ? "text-muted" : perfClass(p.performance)}`}>
                {p.performance === null ? "–" : `${p.performance} %`}
              </b>
            </div>

            <div className="w-[108px]">
              <HealthChip health={p.health} />
            </div>

            <div className="flex w-[104px] items-center gap-2" title={`${p.tasks_complete} tâches avancées sur ${p.tasks_total} · jalons ${p.milestones_achieved}/${p.milestones_total}`}>
              <Ring value={p.progress} color={HEALTH_BAR[p.health]} />
              <span>
                <b className="block text-[14px] font-bold leading-tight">{Math.round(p.progress * 100)} %</b>
                <small className="text-[11px] text-muted">
                  {p.milestones_achieved}/{p.milestones_total} jalons
                </small>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
