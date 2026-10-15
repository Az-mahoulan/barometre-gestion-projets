import type { GanttProject } from "./types";

// Une teinte par projet, partagée par la chronologie et les activités de la semaine. Pas de vert, d'orange
// ni de rouge : ces couleurs signifient déjà un état (avance, prévu, retard) ailleurs dans le tableau de bord.
// Couleur franche (pastille, dates clés, partie réalisée), teinte moyenne (barre) et icône.
export const PROJECT_PALETTE = [
  { solid: "#6a4cff", bar: "#b9a9ff", icon: "campaign" },
  { solid: "#1e6bff", bar: "#9cc0ff", icon: "chart" },
  { solid: "#d63aa0", bar: "#f0a8d6", icon: "factcheck" },
  { solid: "#b832d0", bar: "#e3a6ef", icon: "project" },
  { solid: "#4b5bd6", bar: "#b3baf3", icon: "rocket" },
  { solid: "#5b6b85", bar: "#bcc5d4", icon: "training" },
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
