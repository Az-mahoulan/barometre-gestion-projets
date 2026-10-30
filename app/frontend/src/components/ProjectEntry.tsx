"use client";

import { useState, type FormEvent } from "react";

import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import { shortDate } from "@/lib/format";
import type { ProjectDetail } from "@/lib/types";

import { ConfirmDialog } from "./ConfirmDialog";
import { CardHeader, Icon } from "./ui";

type Say = (message: string) => void;
type Milestone = ProjectDetail["milestones"][number];
type Deliverable = ProjectDetail["deliverables"][number];

const input = "field h-9 border-line bg-surface text-[13px]";

/** Petit bouton d'action d'une ligne (icône + infobulle). */
function RowButton({ icon, label, onClick, tone = "" }: { icon: string; label: string; onClick: () => void; tone?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={`grid h-8 w-8 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink ${tone}`}>
      <Icon name={icon} className="h-4 w-4" />
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-[12px] font-semibold text-ink">
      <span className="text-[14px] leading-none">+</span>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------------------------------------------- Jalons

function MilestoneForm({
  data,
  initial,
  onDone,
  say,
}: {
  data: ProjectDetail;
  initial?: Milestone;
  onDone: (saved: boolean) => void;
  say: Say;
}) {
  const p = data.project;
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [deps, setDeps] = useState<number[]>(initial?.depends_on ?? []);
  const [busy, setBusy] = useState(false);
  const others = data.milestones.filter((m) => m.id !== initial?.id);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { name, due_date: date, depends_on: deps };
      if (initial) await apiPatch(`/milestones/${initial.id}/`, body);
      else await apiPost(`/projects/${p.id}/milestones/`, body);
      say(initial ? `Jalon « ${name} » modifié.` : `Jalon « ${name} » ajouté.`);
      onDone(true);
    } catch (err) {
      say((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="my-2 rounded-[14px] bg-surface-2/60 p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
        <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-muted">
          Nom du jalon *
          <input required autoFocus maxLength={160} className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Rapport préliminaire validé" />
        </label>
        <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-muted">
          Échéance *
          <input required type="date" min={p.start} max={p.end} className={input} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      {others.length > 0 && (
        <fieldset className="mt-3">
          <legend className="text-[11.5px] font-semibold text-muted">Dépend de (ce jalon ne peut aboutir qu’après) :</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {others.map((m) => {
              const on = deps.includes(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  aria-pressed={on}
                  onClick={() => setDeps(on ? deps.filter((d) => d !== m.id) : [...deps, m.id])}
                  className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${on ? "bg-side text-white" : "bg-surface text-ink-2 hover:text-ink"}`}
                >
                  {on && "✓ "}
                  {m.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <div className="mt-3 flex gap-2">
        <button className="btn btn-dark btn-sm" disabled={busy}>
          {initial ? "Enregistrer" : "Ajouter le jalon"}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => onDone(false)}>
          Annuler
        </button>
        <small className="self-center text-[11px] text-muted">
          Entre le {shortDate(p.start)} et le {shortDate(p.end)}
        </small>
      </div>
    </form>
  );
}

/** Jalons du projet ; le responsable (ou un administrateur) peut en ajouter, modifier, marquer atteints, supprimer. */
export function MilestonesSection({ data, color, refresh, say }: { data: ProjectDetail; color: string; refresh: () => void; say: Say }) {
  const p = data.project;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [removing, setRemoving] = useState<Milestone | null>(null);
  const names = new Map(data.milestones.map((m) => [m.id, m.name]));
  const done = (saved: boolean) => {
    setAdding(false);
    setEditing(null);
    if (saved) refresh();
  };
  async function toggle(m: Milestone) {
    try {
      await apiPatch(`/milestones/${m.id}/`, { achieved_on: m.achieved ? null : data.as_of });
      say(m.achieved ? `Jalon « ${m.name} » rouvert.` : `Jalon « ${m.name} » atteint.`);
      refresh();
    } catch (err) {
      say((err as Error).message);
    }
  }
  async function remove() {
    if (!removing) return;
    try {
      await apiDelete(`/milestones/${removing.id}/`);
      say(`Jalon « ${removing.name} » supprimé.`);
      refresh();
    } catch (err) {
      say((err as Error).message);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <section className="card" aria-label="Jalons">
      <CardHeader
        title="Jalons"
        aside={
          <span className="flex items-center gap-3">
            {`${p.milestones_achieved} atteint${p.milestones_achieved > 1 ? "s" : ""} sur ${p.milestones_total}`}
            {data.can_manage && !adding && <AddButton label="Ajouter un jalon" onClick={() => setAdding(true)} />}
          </span>
        }
      />
      {adding && <MilestoneForm data={data} onDone={done} say={say} />}
      <ul className="flex flex-col divide-y divide-line">
        {data.milestones.map((m) =>
          editing === m.id ? (
            <li key={m.id}>
              <MilestoneForm data={data} initial={m} onDone={done} say={say} />
            </li>
          ) : (
            <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
              <Icon name="flag" className={`h-4 w-4 ${m.achieved ? "text-ok" : m.overdue ? "text-late" : "text-muted"}`} />
              <div className="min-w-[160px] flex-1">
                <b className="block text-[13px] font-semibold">{m.name}</b>
                {m.depends_on.length > 0 && (
                  <small className="text-[11px] text-muted">Après : {m.depends_on.map((d) => names.get(d)).filter(Boolean).join(", ")}</small>
                )}
              </div>
              <span className="w-[150px]">
                <span className="block h-1.5 overflow-hidden rounded-full bg-track">
                  <span className="block h-full rounded-full" style={{ width: `${Math.round(m.progress * 100)}%`, background: m.achieved ? "var(--bar-ok)" : color }} />
                </span>
                <small className="text-[11px] text-muted">
                  {Math.round(m.progress * 100)} % · {m.tasks_complete}/{m.tasks_total} tâches
                </small>
              </span>
              <span className="w-[64px] text-right text-[12px] text-ink-2">{shortDate(m.date)}</span>
              <span className={`chip w-[72px] justify-center ${m.achieved ? "bg-ok-soft text-ok" : m.overdue ? "bg-late-soft text-late" : "bg-surface-2 text-ink-2"}`}>
                {m.achieved ? "Atteint" : m.overdue ? "Dépassé" : "À venir"}
              </span>
              {data.can_manage && (
                <span className="flex">
                  <RowButton icon={m.achieved ? "shuffle" : "check"} label={m.achieved ? "Rouvrir le jalon" : "Marquer comme atteint"} onClick={() => toggle(m)} tone={m.achieved ? "" : "text-ok"} />
                  <RowButton icon="edit" label="Modifier" onClick={() => setEditing(m.id)} />
                  <RowButton icon="trash" label="Supprimer" onClick={() => setRemoving(m)} tone="hover:!text-late" />
                </span>
              )}
            </li>
          ),
        )}
        {data.milestones.length === 0 && !adding && <li className="py-2 text-[12.5px] text-muted">Aucun jalon.</li>}
      </ul>
      <ConfirmDialog
        open={!!removing}
        title="Supprimer ce jalon ?"
        message={`« ${removing?.name ?? ""} » sera supprimé. Les activités qui y étaient rattachées restent, sans jalon.`}
        confirmLabel="Supprimer"
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}

// ------------------------------------------------------------------------------------------------------------- Livrables

function DeliverableForm({ data, initial, onDone, say }: { data: ProjectDetail; initial?: Deliverable; onDone: (saved: boolean) => void; say: Say }) {
  const p = data.project;
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.due ?? "");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { name, due_date: date };
      if (initial) await apiPatch(`/deliverables/${initial.id}/`, body);
      else await apiPost(`/projects/${p.id}/deliverables/`, body);
      say(initial ? `Livrable « ${name} » modifié.` : `Livrable « ${name} » ajouté.`);
      onDone(true);
    } catch (err) {
      say((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="my-2 flex flex-col gap-2 rounded-[14px] bg-surface-2/60 p-3">
      <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-muted">
        Intitulé *
        <input required autoFocus maxLength={160} className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Rapport final" />
      </label>
      <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-muted">
        À remettre pour le *
        <input required type="date" min={p.start} max={p.end} className={input} value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <button className="btn btn-dark btn-sm" disabled={busy}>
          {initial ? "Enregistrer" : "Ajouter"}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => onDone(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/** Livrables du projet ; le responsable (ou un administrateur) peut en ajouter, modifier, marquer remis, supprimer. */
export function DeliverablesSection({ data, refresh, say }: { data: ProjectDetail; refresh: () => void; say: Say }) {
  const p = data.project;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [removing, setRemoving] = useState<Deliverable | null>(null);
  const done = (saved: boolean) => {
    setAdding(false);
    setEditing(null);
    if (saved) refresh();
  };
  async function toggle(d: Deliverable) {
    try {
      await apiPatch(`/deliverables/${d.id}/`, { delivered_on: d.delivered_on ? null : data.as_of });
      say(d.delivered_on ? `« ${d.name} » n’est plus marqué comme remis.` : `Livrable « ${d.name} » remis.`);
      refresh();
    } catch (err) {
      say((err as Error).message);
    }
  }
  async function remove() {
    if (!removing) return;
    try {
      await apiDelete(`/deliverables/${removing.id}/`);
      say(`Livrable « ${removing.name} » supprimé.`);
      refresh();
    } catch (err) {
      say((err as Error).message);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <section className="card" aria-label="Livrables">
      <CardHeader
        title="Livrables"
        aside={
          <span className="flex items-center gap-2">
            {`${p.deliverables_done}/${p.deliverables_total} remis`}
            {data.can_manage && !adding && <AddButton label="Ajouter" onClick={() => setAdding(true)} />}
          </span>
        }
      />
      {adding && <DeliverableForm data={data} onDone={done} say={say} />}
      <ul className="flex flex-col gap-1">
        {data.deliverables.map((d) =>
          editing === d.id ? (
            <li key={d.id}>
              <DeliverableForm data={data} initial={d} onDone={done} say={say} />
            </li>
          ) : (
            <li key={d.id} className="group flex items-center gap-2.5 py-1 text-[12.5px]">
              <button
                type="button"
                disabled={!data.can_manage}
                onClick={() => toggle(d)}
                aria-label={d.delivered_on ? `Annuler la remise de « ${d.name} »` : `Marquer « ${d.name} » comme remis`}
                title={data.can_manage ? (d.delivered_on ? "Annuler la remise" : "Marquer comme remis") : undefined}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${d.delivered_on ? "bg-ok-soft text-ok" : d.late ? "bg-late-soft text-late" : "bg-surface-2 text-muted"} ${data.can_manage ? "hover:ring-2 hover:ring-line" : ""}`}
              >
                <Icon name={d.delivered_on ? "check" : "clock"} className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium" title={d.name}>
                  {d.name}
                </span>
                <small className={`block text-[11px] ${d.late ? "font-semibold text-late" : "text-muted"}`}>
                  {d.delivered_on ? `remis le ${shortDate(d.delivered_on)}` : `pour le ${shortDate(d.due)}${d.late ? " · en retard" : ""}`}
                </small>
              </span>
              {data.can_manage && (
                <span className="flex opacity-60 group-hover:opacity-100">
                  <RowButton icon="edit" label="Modifier" onClick={() => setEditing(d.id)} />
                  <RowButton icon="trash" label="Supprimer" onClick={() => setRemoving(d)} tone="hover:!text-late" />
                </span>
              )}
            </li>
          ),
        )}
        {data.deliverables.length === 0 && !adding && <li className="text-[12.5px] text-muted">Aucun livrable.</li>}
      </ul>
      <ConfirmDialog
        open={!!removing}
        title="Supprimer ce livrable ?"
        message={`« ${removing?.name ?? ""} » sera supprimé du projet.`}
        confirmLabel="Supprimer"
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}
