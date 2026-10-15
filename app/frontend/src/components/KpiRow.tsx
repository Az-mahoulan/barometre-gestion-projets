import type { Kpis } from "@/lib/types";

import { Tile, TONES, type Tone } from "./ui";

function Kpi({
  icon,
  tone,
  title,
  sub,
  value,
  valueClass = "",
  tag,
  tagTone,
}: {
  icon: string;
  tone: Tone;
  title: string;
  sub: string;
  value: string | number;
  valueClass?: string;
  tag?: string;
  tagTone?: Tone;
}) {
  return (
    <div className="min-w-0 rounded-[22px] bg-surface p-4">
      <div className="flex items-center gap-2.5">
        <Tile icon={icon} tone={tone} className="h-9 w-9" />
        <div className="min-w-0">
          <div className="text-[13px] font-bold leading-tight">{title}</div>
          <div className="truncate text-[12px] text-muted">{sub}</div>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <span className={`whitespace-nowrap text-[30px] font-extrabold leading-none tracking-[-1px] ${valueClass}`}>{value}</span>
        {tag && <span className={`chip ${TONES[tagTone ?? tone]}`}>{tag}</span>}
      </div>
    </div>
  );
}

export function KpiRow({ kpis }: { kpis: Kpis }) {
  const late = kpis.late_milestones;
  return (
    <section aria-label="Indicateurs" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        icon="rocket"
        tone="lav"
        title="Projets en cours"
        sub="sur la période"
        value={kpis.active_projects}
        tag={kpis.at_risk_projects ? `${kpis.at_risk_projects} à surveiller` : undefined}
        tagTone="sand"
      />
      <Kpi
        icon="clock"
        tone="rose"
        title="Projets en retard"
        sub="jalons ou tâches"
        value={kpis.late_projects}
        valueClass={kpis.late_projects ? "text-late" : ""}
        tag={late ? `${late} jalon${late > 1 ? "s" : ""} dépassé${late > 1 ? "s" : ""}` : "aucun jalon dépassé"}
        tagTone={late ? "rose" : "mint"}
      />
      <Kpi icon="taskalt" tone="mint" title="Projets achevés" sub="sur la période" value={kpis.completed_projects} />
      <Kpi
        icon="flag"
        tone="peach"
        title="Jalons atteints"
        sub={`${kpis.milestones_achieved} sur ${kpis.milestones_total}`}
        value={`${kpis.milestones_pct} %`}
      />
    </section>
  );
}
