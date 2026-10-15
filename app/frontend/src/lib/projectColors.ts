import type { GanttProject } from "./types";

// Une teinte par projet, partagée par la chronologie et les activités de la semaine :
// couleur franche (pastille, dates clés, partie réalisée), teinte moyenne (barre) et icône.
export const PROJECT_PALETTE = [
  { solid: "#7b61ff", bar: "#bdb0ff", icon: "campaign" },
  { solid: "#2f7bff", bar: "#9fc0ff", icon: "chart" },
  { solid: "#ff4d7e", bar: "#ffadc4", icon: "factcheck" },
  { solid: "#10b981", bar: "#8ee0c2", icon: "project" },
  { solid: "#ffad14", bar: "#ffd57a", icon: "rocket" },
  { solid: "#ff6a2b", bar: "#ffb995", icon: "training" },
  { solid: "#06b6d4", bar: "#8fe0ee", icon: "work" },
  { solid: "#22242a", bar: "#b9bcc4", icon: "review" },
];
export type ProjectColor = (typeof PROJECT_PALETTE)[number];

/** Couleur stable d'un projet : rang parmi les projets en cours, puis les autres à la suite. */
export function projectColor(projects: GanttProject[], id: number): ProjectColor {
  const ordered = [...projects.filter((p) => p.status === "active"), ...projects.filter((p) => p.status !== "active")];
  const i = Math.max(0, ordered.findIndex((p) => p.id === id));
  return PROJECT_PALETTE[i % PROJECT_PALETTE.length];
}
