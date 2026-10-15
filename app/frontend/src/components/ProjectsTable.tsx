import { shortDate } from "@/lib/format";
import type { ProjectRow } from "@/lib/types";

import { Deadline } from "./Deadline";
import { Avatar, HEALTH_BAR, Tile, type Tone } from "./ui";

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

// Vague répétée (période 16) : la translation d'une période donne un mouvement sans à-coup.
const WAVE = `M -16 0 ${Array.from({ length: 6 }, () => "q 4 -1.6 8 0 t 8 0").join(" ")} L 80 44 L -16 44 Z`;

/** Verre de livrables : le niveau du liquide suit la part des livrables remis ; le liquide, à la couleur de l'état du projet, tangue doucement. */
function Glass({ done, total, id, color, still }: { done: number; total: number; id: number; color: string; still: boolean }) {
  // Projet achevé : verre plein jusqu'au bord, liquide immobile.
  const ratio = still ? 1 : total > 0 ? done / total : 0;
  const y = 38 - ratio * 30; // fond du verre à 38, bord utile à 8
  const clip = `verre-${id}`;
  return (
    <svg viewBox="0 0 32 40" className="h-10 w-8 shrink-0" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d="M 5.5 3 L 26.5 3 L 24 35.5 Q 23.8 38 21.3 38 L 10.7 38 Q 8.2 38 8 35.5 Z" />
        </clipPath>
      </defs>
      <path d="M 5.5 3 L 26.5 3 L 24 35.5 Q 23.8 38 21.3 38 L 10.7 38 Q 8.2 38 8 35.5 Z" fill="var(--track)" />
      {still && <rect x="0" y="5" width="32" height="40" fill={`color-mix(in srgb, ${color} 70%, white)`} clipPath={`url(#${clip})`} />}
      {!still && ratio > 0 && (
        <g clipPath={`url(#${clip})`}>
          <g className="verre-niveau">
            <g className="verre-tangue">
              <g transform={`translate(0 ${y})`}>
                <g transform="translate(-6 -1.2)">
                  <path className="verre-vague-2" d={WAVE} fill={color} fillOpacity="0.4" />
                </g>
                <path className="verre-vague" d={WAVE} fill={`color-mix(in srgb, ${color} 70%, white)`} />
              </g>
            </g>
          </g>
        </g>
      )}
      <path
        d="M 5.5 3 L 26.5 3 L 24 35.5 Q 23.8 38 21.3 38 L 10.7 38 Q 8.2 38 8 35.5 Z"
        fill="none"
        stroke="#8a93a3"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M 9 7 L 10.6 31" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Contour discret de chaque photo : un fin liseré blanc puis un trait gris très fin, pour bien séparer les visages superposés.
const EDGE = "shadow-[0_0_0_1px_var(--surface),0_0_0_1.75px_#dcdfe4]";

/** Photos des personnes qui travaillent sur le projet (responsable en premier), superposées. */
function Team({ team }: { team: ProjectRow["team"] }) {
  const MAX = 6;
  const shown = team.slice(0, MAX);
  const rest = team.length - shown.length;
  return (
    <span className="mt-1 flex items-center" title={team.map((m) => m.name).join(", ")} aria-label={`Équipe : ${team.map((m) => m.name).join(", ")}`}>
      {shown.map((m, i) => (
        <span key={m.name} className={`grid h-[22px] w-[22px] shrink-0 rounded-full ${EDGE} ${i > 0 ? "-ml-1.5" : ""}`}>
          <Avatar initials={m.initials} seed={m.name} size="h-[22px] w-[22px] text-[9px]" />
        </span>
      ))}
      {rest > 0 && (
        <span className={`-ml-1.5 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-surface-2 px-1 text-[10px] font-semibold text-ink-2 ${EDGE}`}>
          +{rest}
        </span>
      )}
    </span>
  );
}

export function ProjectsTable({ projects, now }: { projects: ProjectRow[]; now: string }) {
  return (
    <section aria-label="Vue d’ensemble des projets">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold">Vue d’ensemble des projets</h2>
        <span className="text-[12px] text-muted" title="Performance = avancement réel ÷ avancement attendu à cette date">
          {projects.length} projets · performance = avancement réel ÷ attendu
        </span>
      </div>

      {projects.length === 0 && <p className="card text-muted">Aucun projet pour ces filtres.</p>}

      <ul className="flex flex-col gap-3">
        {projects.map((p, i) => (
          <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-3 rounded-[18px] bg-surface px-[18px] py-3.5">
            <div className="flex min-w-[170px] flex-1 items-center gap-3">
              <Tile icon="project" tone={TILE_TONES[i % TILE_TONES.length]} />
              <div className="min-w-0">
                <b className="block truncate text-[13px] font-bold">{p.name}</b>
                <Team team={p.team} />
              </div>
            </div>

            <div
              className="flex w-[104px] items-center gap-2"
              title={`${p.deliverables_done} livrable${p.deliverables_done > 1 ? "s" : ""} remis sur ${p.deliverables_total}`}
              aria-label={`Livrables : ${p.deliverables_done} sur ${p.deliverables_total}`}
            >
              <Glass done={p.deliverables_done} total={p.deliverables_total} id={p.id} color={HEALTH_BAR[p.health]} still={p.health === "completed"} />
              <span className="text-[11.5px] text-muted">
                Livrables
                <b className="block text-[13px] font-bold text-ink">
                  {p.deliverables_total > 0 ? `${p.deliverables_done}/${p.deliverables_total}` : "–"}
                </b>
              </span>
            </div>

            <div className="w-[78px] text-[11.5px] text-muted">
              Performance
              <b className={`block text-[12.5px] ${p.performance === null ? "text-muted" : perfClass(p.performance)}`}>
                {p.performance === null ? "–" : `${p.performance} %`}
              </b>
            </div>

            <div className="w-[136px] text-[11.5px] text-muted" title={`${shortDate(p.start)} → ${shortDate(p.end)}`}>
              Prochain jalon
              {p.next_milestone ? (
                <b className={`block truncate text-[12.5px] ${p.next_milestone.overdue ? "text-late" : "text-ink"}`}>
                  {p.next_milestone.name}, {p.next_milestone.overdue ? "dépassé" : shortDate(p.next_milestone.date)}
                </b>
              ) : (
                <b className="block text-[12.5px] text-ink">–</b>
              )}
            </div>

            <div className="flex w-[104px] items-center gap-2" title={`${p.tasks_complete} tâches avancées sur ${p.tasks_total} · jalons ${p.milestones_achieved}/${p.milestones_total}`}>
              <Ring value={p.progress} color={HEALTH_BAR[p.health]} />
              <span>
                <b className="block text-[13px] font-bold leading-tight">{Math.round(p.progress * 100)} %</b>
                <small className="text-[10.5px] text-muted">
                  {p.milestones_achieved}/{p.milestones_total} jalons
                </small>
              </span>
            </div>

            <div className="w-[150px]">
              <Deadline health={p.health} start={p.start} end={p.end} now={now} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
