"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const GAP = 16; // marge avec le haut ou le bas de la fenêtre

/**
 * Colonne de droite « accrochée » : elle défile avec la page jusqu'à ce que son dernier élément soit entièrement
 * visible, puis reste en place pendant que la grande colonne continue de défiler (au retour vers le haut, elle
 * redescend avec la page). Seulement sur grand écran, quand les deux colonnes sont côte à côte.
 */
export function StickySide({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(GAP);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Plus haute que la fenêtre : accrochée par le bas (top négatif) ; sinon, accrochée en haut.
    const update = () => setTop(Math.min(GAP, window.innerHeight - el.offsetHeight - GAP));
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    update();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div ref={ref} className={`min-w-0 xl:sticky xl:self-start ${className}`} style={{ top }}>
      {children}
    </div>
  );
}
