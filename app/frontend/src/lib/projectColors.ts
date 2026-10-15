import type { GanttProject } from "./types";

// Une teinte par projet, partagée par la chronologie et les activités de la semaine :
// couleur franche (pastille, dates clés, partie réalisée), teinte moyenne (barre) et icône.
export const PROJECT_PALETTE = [
  { solid: "#7c6cf0", bar: "#b8acf6", icon: "campaign" },
  { solid: "#3b82f6", bar: "#9dbff3", icon: "chart" },
  { solid: "#e0567f", bar: "#f2a9c0", icon: "factcheck" },
  { solid: "#1fa37a", bar: "#8fd9b8", icon: "project" },
  { solid: "#e5a216", bar: "#f3cd6b", icon: "rocket" },
  { solid: "#e8743b", bar: "#f5b38f", icon: "training" },
  { solid: "#0ea5b7", bar: "#8fd3dc", icon: "work" },
  { solid: "#64748b", bar: "#b7c0cc", icon: "review" },
];
export type ProjectColor = (typeof PROJECT_PALETTE)[number];

/** Couleur stable d'un projet : rang parmi les projets en cours, puis les autres à la suite. */
export function projectColor(projects: GanttProject[], id: number): ProjectColor {
  const ordered = [...projects.filter((p) => p.status === "active"), ...projects.filter((p) => p.status !== "active")];
  const i = Math.max(0, ordered.findIndex((p) => p.id === id));
  return PROJECT_PALETTE[i % PROJECT_PALETTE.length];
}
