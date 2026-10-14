import type { Kpis } from "@/lib/types";

function Kpi({
  title,
  value,
  note,
  tone = "light",
  valueClass = "",
  children,
}: {
  title: string;
  value: string | number;
  note?: string;
  tone?: "light" | "green";
  valueClass?: string;
  children?: React.ReactNode;
}) {
  const green = tone === "green";
  return (
    <div
      className={`flex h-[112px] flex-col rounded-2xl border px-[18px] py-4 ${
        green ? "border-accent bg-accent text-white" : "border-line bg-surface"
      }`}
    >
      <div className={`text-[13.5px] font-medium ${green ? "text-[#cfe8d9]" : "text-ink-2"}`}>{title}</div>
      <div className={`mt-1.5 text-[40px] font-semibold leading-[1.05] tracking-[-1.2px] ${valueClass}`}>{value}</div>
      <div className={`mt-auto flex items-center gap-2.5 text-[12.5px] ${green ? "text-[#cfe8d9]" : "text-muted"}`}>
        {children ?? note}
      </div>
    </div>
  );
}

export function KpiRow({ kpis }: { kpis: Kpis }) {
  const lateMilestones = kpis.late_milestones;
  return (
    <section aria-label="Indicateurs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        tone="green"
        title="Projets en cours"
        value={kpis.active_projects}
        note={`dont ${kpis.at_risk_projects} à surveiller`}
      />
      <Kpi title="Projets en retard" value={kpis.late_projects} valueClass={kpis.late_projects ? "text-late" : ""}>
        {lateMilestones > 0 ? (
          <span className="chip bg-late-soft text-late">
            {lateMilestones} jalon{lateMilestones > 1 ? "s" : ""} dépassé{lateMilestones > 1 ? "s" : ""}
          </span>
        ) : (
          "Aucun jalon dépassé"
        )}
      </Kpi>
      <Kpi title="Projets achevés" value={kpis.completed_projects} note="sur la période" />
      <Kpi title="Jalons atteints" value={`${kpis.milestones_pct} %`}>
        <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--track)]">
          <i className="block h-full bg-accent-2" style={{ width: `${kpis.milestones_pct}%` }} />
        </span>
        {kpis.milestones_achieved} sur {kpis.milestones_total}
      </Kpi>
    </section>
  );
}
