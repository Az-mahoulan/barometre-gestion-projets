import type { Dashboard, Member } from "@/lib/types";

import { Avatar, CardHeader, Icon, TONES, type Tone } from "./ui";

const STATUS: Record<Member["status"], { tone: Tone; icon: string }> = {
  available: { tone: "mint", icon: "taskalt" },
  meeting: { tone: "lav", icon: "users" },
  mission: { tone: "sky", icon: "mission" },
  training: { tone: "sand", icon: "training" },
  leave: { tone: "gray", icon: "leave" },
};

export function TeamsTable({ teams }: { teams: Dashboard["teams"] }) {
  return (
    <section className="card" aria-label="Vue d’ensemble des équipes">
      <CardHeader title="Vue d’ensemble des équipes" aside={`${teams.available} disponible${teams.available > 1 ? "s" : ""} sur ${teams.total}`} />
      {teams.members.length === 0 && <p className="text-muted">Aucun membre pour ce pays.</p>}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {teams.members.map((m) => {
          const st = STATUS[m.status];
          return (
            <li key={m.id} className="flex flex-col rounded-[18px] border border-line p-3.5">
              <div className="flex items-center gap-2.5">
                <Avatar initials={m.initials} size="h-[38px] w-[38px] text-[13px]" />
                <div className="min-w-0">
                  <b className="block truncate text-[13px] font-bold">{m.name}</b>
                  <small className="block truncate text-[11.5px] text-muted">
                    {m.job_title}
                    {m.country ? `, ${m.country}` : ""}
                  </small>
                </div>
              </div>
              <span className={`chip mt-3 self-start ${TONES[st.tone]}`}>
                <Icon name={st.icon} className="h-3.5 w-3.5" />
                {m.status_label}
              </span>
              <p className="mt-2 min-h-[34px] text-[12px] leading-snug text-ink-2">{m.reason ? `${m.reason.replace(/\.$/, "")} · ${m.place_label}` : m.place_label}</p>
              <div className="mt-auto pt-2.5 text-[11.5px] text-muted">
                <span>
                  {m.open_tasks} tâche{m.open_tasks > 1 ? "s" : ""}
                  {m.overdue_tasks > 0 && <b className="text-late"> · {m.overdue_tasks} en retard</b>}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
