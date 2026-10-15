"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { GanttProject } from "@/lib/types";

import { HEALTH_BAR, Icon } from "./ui";

const HEALTH_LABEL: Record<GanttProject["health"], string> = {
  ok: "Dans les temps",
  risk: "À surveiller",
  late: "En retard",
  completed: "Achevé",
};

type Option = { id: string; project?: GanttProject };

/**
 * Filtre par projet : bouton sombre bien visible, panneau sombre façon carte de l'assistant.
 * Chaque projet montre sa santé (pastille de couleur) et son avancement ; le choix actif passe en vert-citron.
 */
export function ProjectPicker({
  projects,
  value,
  onChange,
  label = "Filtrer par projet",
}: {
  projects: GanttProject[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  const running = projects.filter((p) => p.health !== "completed");
  const done = projects.filter((p) => p.health === "completed");
  const options: Option[] = [{ id: "" }, ...[...running, ...done].map((p) => ({ id: String(p.id), project: p }))];
  const current = projects.find((p) => String(p.id) === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const show = () => {
    setActive(Math.max(0, options.findIndex((o) => o.id === value)));
    setOpen(true);
  };
  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") setActive((a) => Math.min(options.length - 1, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Enter" || e.key === " ") choose(options[active].id);
    else return;
    e.preventDefault();
  };

  const row = (o: Option, i: number) => {
    const selected = o.id === value;
    const p = o.project;
    return (
      <li
        key={o.id || "all"}
        id={`${listId}-${i}`}
        role="option"
        aria-selected={selected}
        onMouseEnter={() => setActive(i)}
        onClick={() => choose(o.id)}
        className={`flex cursor-pointer items-center gap-2.5 rounded-[12px] px-2.5 py-2 ${
          selected ? "bg-lime text-ink" : i === active ? "bg-white/10" : ""
        }`}
      >
        {p ? (
          <i className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/15" style={{ background: HEALTH_BAR[p.health] }} title={HEALTH_LABEL[p.health]} />
        ) : (
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-[8px] ${selected ? "bg-ink text-lime" : "bg-white/10 text-lime"}`}>
            <Icon name="grid" className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{p ? p.name : "Tous les projets"}</span>
        {p ? (
          <span className={`w-9 text-right text-[11px] tabular-nums ${selected ? "text-ink/70" : "text-white/50"}`}>{Math.round(p.progress * 100)} %</span>
        ) : (
          <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${selected ? "bg-ink text-lime" : "bg-white/10 text-white/70"}`}>{projects.length}</span>
        )}
        {selected && <Icon name="check" className="h-4 w-4" />}
      </li>
    );
  };

  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label} : ${current ? current.name : "tous les projets"}`}
        onClick={() => (open ? setOpen(false) : show())}
        className={`flex h-9 max-w-[230px] items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-[12.5px] font-semibold transition-colors ${
          open || current ? "bg-side text-white" : "bg-surface-2 text-ink hover:bg-[#e9e9e2]"
        }`}
      >
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${open || current ? "bg-lime text-ink" : "bg-surface text-ink-2"}`}>
          <Icon name={current ? "project" : "tune"} className="h-4 w-4" />
        </span>
        {current && <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: HEALTH_BAR[current.health] }} />}
        <span className="truncate">{current ? current.name : "Tous les projets"}</span>
        <Icon name={open ? "caretup" : "caretdown"} className="h-4 w-4 shrink-0 opacity-70" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[290px] rounded-[20px] bg-side p-2 text-white shadow-[0_18px_40px_-12px_rgba(28,29,34,0.45)]">
          <p className="px-2.5 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/45">{label}</p>
          <ul id={listId} role="listbox" aria-label={label} aria-activedescendant={`${listId}-${active}`} className="flex max-h-[min(400px,60vh)] flex-col gap-0.5 overflow-y-auto [scrollbar-width:thin]">
            {row(options[0], 0)}
            {running.length > 0 && <li role="presentation" className="px-2.5 pb-1 pt-2.5 text-[10.5px] font-semibold text-white/40">En cours</li>}
            {options.slice(1, 1 + running.length).map((o, i) => row(o, i + 1))}
            {done.length > 0 && <li role="presentation" className="px-2.5 pb-1 pt-2.5 text-[10.5px] font-semibold text-white/40">Achevés</li>}
            {options.slice(1 + running.length).map((o, i) => row(o, i + 1 + running.length))}
          </ul>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 px-2.5 pb-1 pt-2 text-[10.5px] text-white/50">
            {(["ok", "risk", "late"] as const).map((h) => (
              <span key={h} className="inline-flex items-center gap-1.5">
                <i className="h-1.5 w-1.5 rounded-full" style={{ background: HEALTH_BAR[h] }} />
                {HEALTH_LABEL[h]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
