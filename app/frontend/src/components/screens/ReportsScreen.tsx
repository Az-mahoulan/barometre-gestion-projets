"use client";

import Link from "next/link";
import { useState } from "react";

import { parseDate, shortDate } from "@/lib/format";
import { useApi, useCountries } from "@/lib/hooks";
import type { Period, Report } from "@/lib/types";

import { AppFrame, PageHeader } from "../AppFrame";
import { HealthChip, HEALTH_BAR, Icon } from "../ui";

const PERIODS: { key: Period; label: string }[] = [
  { key: "month", label: "Mois en cours" },
  { key: "quarter", label: "Trimestre en cours" },
  { key: "year", label: "Année en cours" },
];

// Même échelle de couleurs que l'évolution mois par mois du tableau de bord.
function pctColor(pct: number) {
  if (pct >= 100) return "#1f7a4d";
  if (pct >= 95) return "#6fbf8f";
  if (pct >= 50) return "#e8901c";
  if (pct >= 25) return "#e2582c";
  return "#c7321f";
}

/** Écran « Rapports » : synthèse de la période, par projet et par pays, export Excel et version imprimable (PDF). */
export function ReportsScreen() {
  const [period, setPeriod] = useState<Period>("year");
  const [country, setCountry] = useState("");
  const q = new URLSearchParams({ period });
  if (country) q.set("country", country);
  const { data, error, refresh } = useApi<Report>(`/reports/?${q}`);
  const countries = useCountries(true);
  const periodLabel = PERIODS.find((p) => p.key === period)!.label;
  // La fin de période renvoyée par le serveur est exclue (1er jour suivant) : on affiche la veille.
  const lastDay = (iso: string) => {
    const d = parseDate(iso);
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <AppFrame asOf={data?.as_of}>
      {() => (
        <>
          <PageHeader
            title="Rapports"
            subtitle={data ? `${periodLabel} · du ${shortDate(data.period.start)} au ${shortDate(lastDay(data.period.end))} · établi le ${shortDate(data.as_of)}` : " "}
            aside={
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <select aria-label="Période" className="field h-9 border-line bg-surface" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                  {PERIODS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <select aria-label="Pays" className="field h-9 border-line bg-surface" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">Tous les pays</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <a href={`/api/v1/reports/?${q}&export=csv`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3.5 text-[12.5px] font-semibold text-ink hover:bg-surface-2">
                  <Icon name="upload" className="h-4 w-4 rotate-180" />
                  Exporter (Excel)
                </a>
                <button onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lime px-3.5 text-[12.5px] font-semibold text-ink">
                  <Icon name="review" className="h-4 w-4" />
                  Imprimer / PDF
                </button>
              </div>
            }
          />

          {error && !data ? (
            <div className="card text-center">
              <p className="font-medium">Impossible de charger le rapport.</p>
              <button className="btn btn-dark mt-3" onClick={refresh}>
                Réessayer
              </button>
            </div>
          ) : !data ? (
            <p className="card text-muted" role="status">
              Chargement…
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Chiffres clés */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Kpi label="Projets en cours" value={data.kpis.active_projects} />
                <Kpi label="En retard" value={data.kpis.late_projects} tone={data.kpis.late_projects ? "text-late" : undefined} />
                <Kpi label="À surveiller" value={data.kpis.at_risk_projects} tone={data.kpis.at_risk_projects ? "text-risk" : undefined} />
                <Kpi label="Projets achevés" value={data.kpis.completed_projects} />
                <Kpi label="Jalons atteints" value={`${data.kpis.milestones_pct} %`} sub={`${data.kpis.milestones_achieved} sur ${data.kpis.milestones_total}`} />
              </div>

              {/* Synthèse par projet */}
              <section className="card overflow-x-auto" aria-label="Synthèse par projet">
                <b className="mb-3 block text-[15px] font-bold">Synthèse par projet</b>
                <table className="w-full min-w-[860px] text-left text-[12.5px]">
                  <thead className="text-[11.5px] text-muted">
                    <tr className="border-b border-line">
                      <th className="py-2 pr-3 font-semibold">Projet</th>
                      <th className="py-2 pr-3 font-semibold">Responsable</th>
                      <th className="py-2 pr-3 font-semibold">État</th>
                      <th className="py-2 pr-3 font-semibold">Avancement</th>
                      <th className="py-2 pr-3 text-right font-semibold">Performance</th>
                      <th className="py-2 pr-3 text-right font-semibold">Jalons</th>
                      <th className="py-2 pr-3 text-right font-semibold">Livrables</th>
                      <th className="py-2 pr-3 text-right font-semibold">Retards</th>
                      <th className="py-2 text-right font-semibold">Fin prévue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.projects.map((p) => (
                      <tr key={p.id} className="border-b border-line last:border-0">
                        <td className="py-2.5 pr-3">
                          <Link href={`/projets/${p.id}`} className="font-semibold hover:underline">
                            {p.name}
                          </Link>
                          <small className="block text-[11px] text-muted">{p.country}</small>
                        </td>
                        <td className="py-2.5 pr-3 text-ink-2">{p.owner}</td>
                        <td className="py-2.5 pr-3">
                          <HealthChip health={p.health} />
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="flex items-center gap-2">
                            <span className="block h-1.5 w-[90px] overflow-hidden rounded-full bg-track">
                              <span className="block h-full rounded-full" style={{ width: `${Math.round(p.progress * 100)}%`, background: HEALTH_BAR[p.health] }} />
                            </span>
                            <b className="font-semibold">{Math.round(p.progress * 100)} %</b>
                          </span>
                        </td>
                        <td className={`py-2.5 pr-3 text-right font-semibold ${p.performance === null ? "text-muted" : p.performance >= 90 ? "text-ok" : p.performance >= 70 ? "text-risk" : "text-late"}`}>
                          {p.performance === null ? "–" : `${p.performance} %`}
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          {p.milestones_achieved}/{p.milestones_total}
                        </td>
                        <td className="py-2.5 pr-3 text-right">{p.deliverables_total ? `${p.deliverables_done}/${p.deliverables_total}` : "–"}</td>
                        <td className={`py-2.5 pr-3 text-right font-semibold ${p.tasks_overdue ? "text-late" : "text-muted"}`}>{p.tasks_overdue}</td>
                        <td className="py-2.5 text-right text-ink-2">{shortDate(p.end)}</td>
                      </tr>
                    ))}
                    {data.projects.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-3 text-muted">
                          Aucun projet sur cette période.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <div className="grid items-start gap-4 xl:grid-cols-2">
                {/* Par pays */}
                <section className="card overflow-x-auto" aria-label="Par pays">
                  <b className="mb-3 block text-[15px] font-bold">Par pays</b>
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="text-[11.5px] text-muted">
                      <tr className="border-b border-line">
                        <th className="py-2 pr-3 font-semibold">Pays</th>
                        <th className="py-2 pr-3 text-right font-semibold">Projets</th>
                        <th className="py-2 pr-3 text-right font-semibold">En retard</th>
                        <th className="py-2 pr-3 text-right font-semibold">À surveiller</th>
                        <th className="py-2 pr-3 text-right font-semibold">Tâches terminées</th>
                        <th className="py-2 text-right font-semibold">Tâches en retard</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.by_country.map((c) => (
                        <tr key={c.country} className="border-b border-line last:border-0">
                          <td className="py-2.5 pr-3 font-semibold">{c.country}</td>
                          <td className="py-2.5 pr-3 text-right">{c.projects}</td>
                          <td className={`py-2.5 pr-3 text-right font-semibold ${c.late ? "text-late" : "text-muted"}`}>{c.late}</td>
                          <td className={`py-2.5 pr-3 text-right font-semibold ${c.risk ? "text-risk" : "text-muted"}`}>{c.risk}</td>
                          <td className="py-2.5 pr-3 text-right">
                            {c.tasks_complete}/{c.tasks_total} <span className="text-muted">({Math.round(c.progress * 100)} %)</span>
                          </td>
                          <td className={`py-2.5 text-right font-semibold ${c.tasks_overdue ? "text-late" : "text-muted"}`}>{c.tasks_overdue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                {/* Évolution mensuelle */}
                <section className="card" aria-label="Évolution mensuelle">
                  <b className="block text-[15px] font-bold">Évolution mois par mois</b>
                  <small className="text-[12px] text-muted">Jalons atteints, en % des jalons prévus chaque mois · projets en cours</small>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {data.trend.map((m) => (
                      <li key={m.month} className="flex items-center gap-3 text-[12.5px]">
                        <span className={`w-[52px] ${m.state === "current" ? "font-bold" : "text-ink-2"}`}>{m.label}</span>
                        <span className="block h-3 flex-1 overflow-hidden rounded-full bg-track">
                          {m.pct !== null && <span className="block h-full rounded-full" style={{ width: `${Math.max(m.pct, 3)}%`, background: pctColor(m.pct) }} />}
                        </span>
                        <span className="w-[120px] text-right text-ink-2">
                          {m.pct === null ? (m.state === "future" ? `${m.total} prévu${m.total > 1 ? "s" : ""}` : "–") : <><b className="text-ink">{m.pct} %</b> · {m.achieved}/{m.total}</>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          )}
        </>
      )}
    </AppFrame>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: number | string; sub?: string; tone?: string }) {
  return (
    <div className="card py-3">
      <small className="block text-[11.5px] text-muted">{label}</small>
      <b className={`text-[22px] font-bold ${tone ?? ""}`}>{value}</b>
      {sub && <small className="block text-[11px] text-muted">{sub}</small>}
    </div>
  );
}
