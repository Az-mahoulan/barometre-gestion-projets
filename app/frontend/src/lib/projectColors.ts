import type { GanttProject } from "./types";

// Une teinte par projet, partagée par la chronologie et les activités de la semaine :
// couleur franche (pastille, dates clés, partie réalisée), teinte moyenne (barre) et icône.
export const PROJECT_PALETTE = [
  { solid: "#6a4cff", bar: "#b9a9ff", icon: "campaign" },
  { solid: "#1e6bff", bar: "#9cc0ff", icon: "chart" },
  { solid: "#ec2d6b", bar: "#f7a1bd", icon: "factcheck" },
  { solid: "#1f8a4c", bar: "#8fcfa9", icon: "project" },
  { solid: "#e8901c", bar: "#f4c27f", icon: "rocket" },
  { solid: "#e2582c", bar: "#f2a988", icon: "training" },
  { solid: "#0b93b5", bar: "#8fd0e0", icon: "work" },
  { solid: "#1c1d22", bar: "#b9bcc4", icon: "review" },
];
export type ProjectColor = (typeof PROJECT_PALETTE)[number];

/** Couleur stable d'un projet : rang parmi les projets en cours, puis les autres à la suite. */
export function projectColor(projects: GanttProject[], id: number): ProjectColor {
  const ordered = [...projects.filter((p) => p.status === "active"), ...projects.filter((p) => p.status !== "active")];
  const i = Math.max(0, ordered.findIndex((p) => p.id === id));
  return PROJECT_PALETTE[i % PROJECT_PALETTE.length];
}
