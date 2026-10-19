"use client";

import { useEffect, useRef, useState } from "react";

import { apiPost } from "@/lib/api";
import type { Country, Me, Period } from "@/lib/types";

import { Avatar, Icon } from "./ui";

export function Topbar({
  me,
  countries = [],
  country = "",
  period = "year",
  alerts = 0,
  onCountry,
  onPeriod,
  onLogout,
  onMeChange,
}: {
  me: Me;
  countries?: Country[];
  country?: string;
  period?: Period;
  alerts?: number;
  /** Filtres du tableau de bord : affichés seulement s'ils sont fournis. */
  onCountry?: (code: string) => void;
  onPeriod?: (p: Period) => void;
  onLogout: () => void;
  onMeChange: (me: Me) => void;
}) {
  return (
    <header className="flex flex-wrap items-center gap-2.5 px-2 pb-3 pt-1.5 print:hidden">
      <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-surface-2 pl-3.5 pr-1.5 text-[12.5px] text-muted">
        <Icon name="search" />
        <span className="sr-only">Rechercher</span>
        <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted" placeholder="Rechercher un projet, une tâche… (bientôt)" disabled />
        <span className="grid h-7 w-7 place-items-center rounded-full bg-surface text-ink-2" aria-hidden="true">
          <Icon name="tune" className="h-4 w-4" />
        </span>
      </label>

      {onCountry && onPeriod && (
        <>
      <label className="sr-only" htmlFor="f-country">
        Pays
      </label>
      <select id="f-country" className="field h-9 border-line" value={country} onChange={(e) => onCountry(e.target.value)}>
        <option value="">Tous les pays</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="f-period">
        Période
      </label>
      <select id="f-period" className="field h-9 border-line" value={period} onChange={(e) => onPeriod(e.target.value as Period)}>
        <option value="year">Année en cours</option>
        <option value="quarter">Trimestre en cours</option>
        <option value="month">Mois en cours</option>
      </select>

        </>
      )}

      <span className="relative grid h-9 w-9 place-items-center rounded-full border border-line text-ink-2" role="img" aria-label={`${alerts} actions à traiter`}>
        <Icon name="bell" className="h-5 w-5" />
        {alerts > 0 && <i className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full border-2 border-surface bg-[#f26b3a]" />}
      </span>
      <button onClick={onLogout} className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-2 hover:text-ink" aria-label="Se déconnecter" title="Se déconnecter">
        <Icon name="logout" className="h-5 w-5" />
      </button>

      <ProfileMenu me={me} onMeChange={onMeChange} />
    </header>
  );
}

const STYLES: { key: Me["avatar_style"]; label: string }[] = [
  { key: "neutral", label: "Neutre" },
  { key: "masculine", label: "Masculin" },
  { key: "feminine", label: "Féminin" },
];

/** Puce du profil : ouvre « Mon avatar » (style d'avatar et tirage d'un nouvel avatar unique). */
function ProfileMenu({ me, onMeChange }: { me: Me; onMeChange: (me: Me) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const change = async (style: Me["avatar_style"]) => {
    setBusy(true);
    setError("");
    try {
      onMeChange(await apiPost<Me>("/auth/me/avatar/", { style }));
    } catch {
      setError("Le changement n’a pas abouti. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full border border-line py-1 pl-1 pr-3 hover:bg-surface-2"
      >
        <Avatar initials={me.initials} seed={me.name} size="h-9 w-9 text-[11.5px]" />
        <span className="text-left leading-tight">
          <b className="block text-[12.5px] font-bold">{me.name}</b>
          <small className="text-[11px] text-muted">{me.role_label}</small>
        </span>
        <Icon name={open ? "caretup" : "caretdown"} className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <div role="dialog" aria-label="Mon avatar" className="absolute right-0 top-[calc(100%+8px)] z-40 w-[260px] rounded-[18px] border border-line bg-surface p-4 shadow-[0_16px_36px_-14px_rgba(28,29,34,0.28)]">
          <div className="flex items-center gap-3">
            <Avatar initials={me.initials} seed={me.name} size="h-14 w-14 text-[14px]" />
            <div className="min-w-0">
              <b className="block truncate text-[13px] font-bold">Mon avatar</b>
              <small className="text-[11px] leading-snug text-muted">Unique à votre profil, en attendant votre photo.</small>
            </div>
          </div>

          <p className="mb-1.5 mt-4 text-[11px] font-semibold text-muted">Style</p>
          <div role="radiogroup" aria-label="Style d’avatar" className="grid grid-cols-3 gap-1 rounded-full bg-surface-2 p-1">
            {STYLES.map((st) => (
              <button
                key={st.key}
                role="radio"
                aria-checked={me.avatar_style === st.key}
                disabled={busy}
                onClick={() => me.avatar_style !== st.key && change(st.key)}
                className={`rounded-full py-1 text-[11.5px] font-semibold ${
                  me.avatar_style === st.key ? "bg-surface text-ink shadow-[0_1px_3px_rgba(28,29,34,0.12)]" : "text-muted hover:text-ink"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => change(me.avatar_style)}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-lime py-2 text-[12.5px] font-semibold text-ink disabled:opacity-60"
          >
            <Icon name="shuffle" className="h-4 w-4" />
            {busy ? "Un instant…" : "Nouvel avatar"}
          </button>
          {error && <p className="mt-2 text-[11.5px] text-late">{error}</p>}

          {(me.dashboard_layout?.main?.length || me.dashboard_layout?.side?.length) ? (
            <button
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  onMeChange(await apiPost<Me>("/auth/me/layout/", {}));
                } catch {
                  setError("Le changement n’a pas abouti. Réessayez.");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="mt-3 w-full border-t border-line pt-3 text-left text-[12px] font-semibold text-ink-2 hover:text-ink disabled:opacity-60"
            >
              Rétablir la disposition des cartes
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
