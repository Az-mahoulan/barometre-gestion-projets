"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

import { apiPatch, apiPost } from "@/lib/api";
import { shortDate } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { AdminOverview, AdminUser, Me } from "@/lib/types";

import { AppFrame, PageHeader } from "../AppFrame";
import { Avatar, Icon } from "../ui";

type Tab = "users" | "projects" | "countries";

/** Écran « Administration » : comptes, projets et pays (administrateurs uniquement). */
export function AdminScreen() {
  return <AppFrame>{(me) => (me.role === "admin" ? <Admin me={me} /> : <Denied />)}</AppFrame>;
}

function Denied() {
  return (
    <section className="card max-w-[520px]">
      <p className="font-semibold">Cet écran est réservé aux administrateurs.</p>
      <Link href="/" className="btn btn-dark mt-4 inline-flex">
        Revenir au tableau de bord
      </Link>
    </section>
  );
}

function Admin({ me }: { me: Me }) {
  const { data, error, refresh } = useApi<AdminOverview>("/admin/overview/");
  const [tab, setTab] = useState<Tab>("users");
  const [local, setLocal] = useState<AdminOverview | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [secret, setSecret] = useState<{ who: string; password: string } | null>(null);
  const view = local ?? data;

  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };
  // Toute modification renvoie l'état à jour : on l'affiche directement.
  async function run(fn: () => Promise<AdminOverview>, done: string) {
    try {
      setLocal(await fn());
      say(done);
      return true;
    } catch (e) {
      say((e as Error).message);
      return false;
    }
  }

  if (error && !view) {
    return (
      <div className="card text-center">
        <p className="font-medium">Impossible de charger l’administration.</p>
        <button className="btn btn-dark mt-3" onClick={refresh}>
          Réessayer
        </button>
      </div>
    );
  }
  if (!view) return <p className="card text-muted">Chargement…</p>;

  const tabs: [Tab, string, number][] = [
    ["users", "Utilisateurs", view.users.length],
    ["projects", "Projets", view.projects.length],
    ["countries", "Pays", view.countries.length],
  ];

  return (
    <>
      <PageHeader
        title="Administration"
        subtitle="Comptes, rôles, projets et pays"
        aside={
          <span role="tablist" aria-label="Rubriques" className="flex rounded-full bg-surface p-1">
            {tabs.map(([k, label, n]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ${tab === k ? "bg-side text-white" : "text-ink-2 hover:text-ink"}`}
              >
                {label} <span className={tab === k ? "text-white/70" : "text-muted"}>{n}</span>
              </button>
            ))}
          </span>
        }
      />

      {secret && (
        <div className="card mb-4 border-2 border-lime" role="alert">
          <p className="text-[13px] font-semibold">Mot de passe provisoire de {secret.who} (affiché une seule fois) :</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-[10px] bg-surface-2 px-3 py-1.5 text-[14px] font-bold tracking-wide">{secret.password}</code>
            <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(secret.password).then(() => say("Copié."))}>
              Copier
            </button>
            <button className="btn btn-sm" onClick={() => setSecret(null)}>
              J’ai noté, masquer
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-muted">Transmettez-le à la personne par un canal sûr ; elle pourra ensuite se connecter.</p>
        </div>
      )}

      {tab === "users" && <Users view={view} me={me} run={run} onSecret={setSecret} say={say} />}
      {tab === "projects" && <Projects view={view} run={run} />}
      {tab === "countries" && <Countries view={view} run={run} />}

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-side px-4 py-2 text-[12.5px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}

type Run = (fn: () => Promise<AdminOverview>, done: string) => Promise<boolean>;

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 text-[11.5px] font-semibold text-muted ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
    </label>
  );
}
const input = "field h-9 border-line bg-surface text-[13px] font-normal text-ink";

function Users({ view, me, run, onSecret, say }: { view: AdminOverview; me: Me; run: Run; onSecret: (s: { who: string; password: string }) => void; say: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", first_name: "", last_name: "", email: "", role: "membre", job_title: "", country: "" });
  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await apiPost<AdminOverview & { password: string; user: AdminUser }>("/admin/users/", { ...form, country: form.country || null });
      onSecret({ who: res.user.name, password: res.password });
      setForm({ username: "", first_name: "", last_name: "", email: "", role: "membre", job_title: "", country: "" });
      setOpen(false);
      await run(async () => res, "Compte créé.");
    } catch (err) {
      say((err as Error).message);
    }
  }
  const patch = (u: AdminUser, body: Partial<AdminUser>, done: string) => run(() => apiPatch<AdminOverview>(`/admin/users/${u.id}/`, body), done);
  async function newPassword(u: AdminUser) {
    try {
      const { password } = await apiPost<{ password: string }>(`/admin/users/${u.id}/password/`);
      onSecret({ who: u.name, password });
    } catch (err) {
      say((err as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card">
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between text-left">
          <b className="flex items-center gap-2 text-[15px] font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-ink">+</span>
            Ajouter un utilisateur
          </b>
          <Icon name={open ? "caretup" : "caretdown"} className="h-4 w-4 text-muted" />
        </button>
        {open && (
          <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-4">
            <Field label="Identifiant *">
              <input required className={input} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <Field label="Prénom">
              <input className={input} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </Field>
            <Field label="Nom">
              <input className={input} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Field>
            <Field label="Courriel">
              <input type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Rôle">
              <select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {view.roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fonction">
              <input className={input} value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
            </Field>
            <Field label="Pays">
              <select className={input} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                <option value="">—</option>
                {view.countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <button className="btn btn-dark h-9 w-full">Créer le compte</button>
            </div>
          </form>
        )}
      </section>

      <section className="card overflow-x-auto" aria-label="Utilisateurs">
        <table className="w-full min-w-[880px] text-left text-[12.5px]">
          <thead className="text-[11.5px] text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-semibold">Personne</th>
              <th className="py-2 pr-3 font-semibold">Rôle</th>
              <th className="py-2 pr-3 font-semibold">Fonction</th>
              <th className="py-2 pr-3 font-semibold">Pays</th>
              <th className="py-2 pr-3 font-semibold">Dernière connexion</th>
              <th className="py-2 pr-3 font-semibold">Accès</th>
              <th className="py-2 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {view.users.map((u) => {
              const self = u.id === me.id;
              return (
                <tr key={u.id} className={`border-b border-line last:border-0 ${u.is_active ? "" : "opacity-55"}`}>
                  <td className="py-2.5 pr-3">
                    <span className="flex items-center gap-2.5">
                      <Avatar initials={u.initials} seed={u.name} size="h-8 w-8 text-[10px]" />
                      <span>
                        <b className="block font-semibold">{u.name}</b>
                        <small className="text-[11px] text-muted">
                          {u.username}
                          {u.email ? ` · ${u.email}` : ""}
                        </small>
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <select className={`${input} h-8 w-[140px]`} value={u.role} disabled={self} title={self ? "Vous ne pouvez pas changer votre propre rôle" : undefined} onChange={(e) => patch(u, { role: e.target.value as AdminUser["role"] }, `Rôle de ${u.name} modifié.`)}>
                      {view.roles.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      className={`${input} h-8 w-[170px]`}
                      defaultValue={u.job_title}
                      aria-label={`Fonction de ${u.name}`}
                      onBlur={(e) => e.target.value !== u.job_title && patch(u, { job_title: e.target.value }, "Fonction enregistrée.")}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <select className={`${input} h-8 w-[130px]`} value={u.country} onChange={(e) => patch(u, { country: e.target.value || null } as never, "Pays enregistré.")}>
                      <option value="">—</option>
                      {view.countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 pr-3 text-ink-2">{u.last_login ? shortDate(u.last_login.slice(0, 10)) : "Jamais"}</td>
                  <td className="py-2.5 pr-3">
                    <button
                      disabled={self}
                      onClick={() => patch(u, { is_active: !u.is_active }, u.is_active ? `Accès de ${u.name} suspendu.` : `Accès de ${u.name} rétabli.`)}
                      className={`chip ${u.is_active ? "bg-ok-soft text-ok" : "bg-late-soft text-late"} disabled:cursor-not-allowed`}
                      title={self ? "Vous ne pouvez pas suspendre votre propre compte" : u.is_active ? "Suspendre l’accès" : "Rétablir l’accès"}
                    >
                      {u.is_active ? "Actif" : "Suspendu"}
                    </button>
                  </td>
                  <td className="py-2.5 text-right">
                    <button className="btn btn-sm" onClick={() => newPassword(u)}>
                      Nouveau mot de passe
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Projects({ view, run }: { view: AdminOverview; run: Run }) {
  const owners = view.users.filter((u) => u.is_active && u.role !== "membre");
  const blank = { name: "", description: "", country: view.countries[0]?.code ?? "", owner: String(owners[0]?.id ?? ""), start_date: "", end_date: "" };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  async function create(e: FormEvent) {
    e.preventDefault();
    const ok = await run(() => apiPost<AdminOverview>("/admin/projects/", { ...form, owner: Number(form.owner) }), `Projet « ${form.name} » créé.`);
    if (ok) {
      setForm(blank);
      setOpen(false);
    }
  }
  const patch = (id: number, body: object, done: string) => run(() => apiPatch<AdminOverview>(`/admin/projects/${id}/`, body), done);

  return (
    <div className="flex flex-col gap-4">
      <section className="card">
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between text-left">
          <b className="flex items-center gap-2 text-[15px] font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-ink">+</span>
            Nouveau projet
          </b>
          <Icon name={open ? "caretup" : "caretdown"} className="h-4 w-4 text-muted" />
        </button>
        {open && (
          <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-4">
            <Field label="Nom du projet *" wide>
              <input required className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Pays *">
              <select required className={input} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                {view.countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Responsable *">
              <select required className={input} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
                {owners.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Début *">
              <input required type="date" className={input} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </Field>
            <Field label="Fin prévue *">
              <input required type="date" min={form.start_date || undefined} className={input} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </Field>
            <Field label="Description" wide>
              <input className={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="flex items-end sm:col-span-4">
              <button className="btn btn-dark h-9">Créer le projet</button>
            </div>
          </form>
        )}
      </section>

      <section className="card overflow-x-auto" aria-label="Projets">
        <table className="w-full min-w-[880px] text-left text-[12.5px]">
          <thead className="text-[11.5px] text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-semibold">Projet</th>
              <th className="py-2 pr-3 font-semibold">Responsable</th>
              <th className="py-2 pr-3 font-semibold">Début</th>
              <th className="py-2 pr-3 font-semibold">Fin prévue</th>
              <th className="py-2 pr-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {view.projects.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-3">
                  <Link href={`/projets/${p.id}`} className="font-semibold hover:underline">
                    {p.name}
                  </Link>
                  <small className="block text-[11px] text-muted">{view.countries.find((c) => c.code === p.country)?.name}</small>
                </td>
                <td className="py-2.5 pr-3">
                  <select className={`${input} h-8 w-[170px]`} value={p.owner} onChange={(e) => patch(p.id, { owner: Number(e.target.value) }, "Responsable modifié.")}>
                    {owners.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                    {!owners.some((u) => u.id === p.owner) && <option value={p.owner}>{p.owner_name}</option>}
                  </select>
                </td>
                <td className="py-2.5 pr-3">
                  <input type="date" className={`${input} h-8`} defaultValue={p.start_date} onBlur={(e) => e.target.value && e.target.value !== p.start_date && patch(p.id, { start_date: e.target.value }, "Date de début enregistrée.")} />
                </td>
                <td className="py-2.5 pr-3">
                  <input type="date" className={`${input} h-8`} defaultValue={p.end_date} onBlur={(e) => e.target.value && e.target.value !== p.end_date && patch(p.id, { end_date: e.target.value }, "Date de fin enregistrée.")} />
                </td>
                <td className="py-2.5 pr-3">
                  <select className={`${input} h-8 w-[120px]`} value={p.status} onChange={(e) => patch(p.id, { status: e.target.value }, "Statut modifié.")}>
                    {view.statuses.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11.5px] text-muted">
          Jalons, activités, livrables et dates clés se saisissent pour l’instant dans l’administration avancée (Django) ; leur saisie dans l’application est la prochaine étape.
        </p>
      </section>
    </div>
  );
}

function Countries({ view, run }: { view: AdminOverview; run: Run }) {
  const [form, setForm] = useState({ code: "", name: "" });
  async function create(e: FormEvent) {
    e.preventDefault();
    if (await run(() => apiPost<AdminOverview>("/admin/countries/", form), `Pays « ${form.name} » ajouté.`)) setForm({ code: "", name: "" });
  }
  return (
    <section className="card max-w-[720px]" aria-label="Pays">
      <form onSubmit={create} className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Code ISO (2 lettres) *">
          <input required maxLength={2} pattern="[A-Za-z]{2}" className={`${input} w-[120px] uppercase`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </Field>
        <Field label="Nom *">
          <input required className={`${input} w-[220px]`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <button className="btn btn-dark h-9">Ajouter le pays</button>
      </form>
      <ul className="flex flex-col divide-y divide-line">
        {view.countries.map((c) => (
          <li key={c.code} className="flex items-center gap-3 py-2.5 text-[13px]">
            <span className="grid h-8 w-10 place-items-center rounded-[8px] bg-surface-2 text-[12px] font-bold">{c.code}</span>
            <b className="flex-1 font-semibold">{c.name}</b>
            <small className="text-[11.5px] text-muted">
              {c.users} personne{c.users > 1 ? "s" : ""} · {c.projects} projet{c.projects > 1 ? "s" : ""}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
