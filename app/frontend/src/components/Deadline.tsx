"use client";

import { useEffect, useId, useState } from "react";

import type { Health } from "@/lib/types";

import { HealthChip } from "./ui";

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Fin de journée locale d'une date AAAA-MM-JJ (l'échéance court jusqu'au soir). */
function endOfDay(iso: string) {
  return new Date(`${iso}T23:59:59`).getTime();
}

function startOfDay(iso: string) {
  return new Date(`${iso}T00:00:00`).getTime();
}

/**
 * Horloge : part de l'heure de référence du serveur et avance chaque seconde. Rien n'est calculé côté serveur
 * (null) : l'échéance dépend du fuseau de l'appareil, le décompte s'affiche dès le premier tic dans le navigateur.
 */
function useClock(reference: string) {
  const [elapsed, setElapsed] = useState<number | null>(null);
  useEffect(() => {
    const t0 = Date.now();
    const tick = () => setElapsed(Date.now() - t0);
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, SEC);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [reference]);
  return elapsed === null ? null : new Date(reference).getTime() + elapsed;
}

/** Sablier : le sable du haut est le temps restant, celui du bas le temps écoulé depuis le début du projet. */
function Hourglass({ elapsed, running }: { elapsed: number; running: boolean }) {
  const clip = useId();
  const top = 1 - elapsed; // part restante
  const bulb = "M 4 2.5 L 12 2.5 C 12 6.5 9 9 8.7 11 C 9 13 12 15.5 12 19.5 L 4 19.5 C 4 15.5 7 13 7.3 11 C 7 9 4 6.5 4 2.5 Z";
  return (
    <svg viewBox="0 0 16 22" className="h-[22px] w-4 shrink-0" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d={bulb} />
        </clipPath>
      </defs>
      <path d={bulb} fill="currentColor" fillOpacity="0.12" />
      <g clipPath={`url(#${clip})`} fill="currentColor">
        {/* haut : le sable se creuse par le dessus */}
        <rect x="0" y={11 - top * 8} width="16" height={top * 8} />
        {/* bas : le tas monte depuis le fond */}
        <rect x="0" y={19.5 - elapsed * 8.5} width="16" height={elapsed * 8.5} />
        {running && <line className="sablier-filet" x1="8" y1="11" x2="8" y2="19.5" stroke="currentColor" strokeWidth="0.9" strokeDasharray="1 1.4" />}
      </g>
      <path d={bulb} fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" strokeOpacity="0.7" />
      <path d="M 2.5 1.5 H 13.5 M 2.5 20.5 H 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Décompte semaines · jours · heures · minutes (les semaines et jours nuls sont omis). */
function Countdown({ ms }: { ms: number }) {
  const w = Math.floor(ms / WEEK);
  const d = Math.floor((ms % WEEK) / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / MIN);
  const pad = (n: number) => String(n).padStart(2, "0");
  const parts: [string, string][] = [];
  if (w > 0) parts.push([String(w), "sem"]);
  if (w > 0 || d > 0) parts.push([String(d), "j"]);
  parts.push([pad(h), "h"], [pad(m), "min"]);
  return (
    <span className="tabular-nums">
      {parts.map(([n, u]) => (
        <span key={u} className="mr-[3px] last:mr-0">
          <b className="font-semibold text-ink">{n}</b>
          <span className="ml-[1px]">{u}</span>
        </span>
      ))}
    </span>
  );
}

const TEXT: Record<Health, string> = { ok: "text-ok", risk: "text-risk", late: "text-late", completed: "text-ink-2" };

/** Étiquette d'état du projet avec sablier et temps restant avant l'échéance, mis à jour en continu. */
export function Deadline({ health, start, end, now }: { health: Health; start: string; end: string; now: string }) {
  const t = useClock(now);
  if (health === "completed") return <HealthChip health={health} />;
  if (t === null) return <HealthChip health={health} />;
  const s = startOfDay(start);
  const e = endOfDay(end);
  const left = e - t;
  const elapsed = Math.min(1, Math.max(0, (t - s) / Math.max(e - s, 1)));
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="flex items-center gap-1.5">
        <HealthChip health={health} />
        <span className={TEXT[health]}>
          <Hourglass elapsed={elapsed} running={left > 0} />
        </span>
      </span>
      <span className="whitespace-nowrap text-[10.5px] text-muted" title={`Échéance du projet : ${new Date(e).toLocaleDateString("fr-FR")}`}>
        {left > 0 ? (
          <Countdown ms={left} />
        ) : (
          <span className="font-semibold text-late">
            Échéance dépassée de <Countdown ms={-left} />
          </span>
        )}
      </span>
    </div>
  );
}
