// Génère src/components/icons.generated.ts depuis la bibliothèque Solar (480 Design, licence CC BY 4.0) via Iconify.
// Les icônes sont des SVG monochromes : elles prennent la couleur du texte (couleurs de la plateforme).
// Seules les icônes listées ici sont incluses dans l'application. Relancer : node scripts/generate-icons.mjs
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

import { getIconData, iconToSVG } from "@iconify/utils";

const require = createRequire(import.meta.url);
const solar = require("@iconify-json/solar/icons.json");

// Interface (menu, recherche, actions) : version « trait ».
const MONO = {
  grid: "widget-2-linear",
  folder: "folder-linear",
  task: "checklist-minimalistic-linear",
  calendar: "calendar-linear",
  users: "users-group-rounded-linear",
  chart: "chart-2-linear",
  shield: "shield-user-linear",
  gear: "settings-linear",
  search: "magnifer-linear",
  bell: "bell-linear",
  sparkle: "magic-stick-3-linear",
  upload: "upload-linear",
  send: "plain-2-linear",
  flag: "flag-linear",
  clock: "clock-circle-linear",
  check: "check-circle-linear",
  chevron: "alt-arrow-down-linear",
  pin: "map-point-linear",
  logout: "logout-2-linear",
};

// Tuiles de progression des tâches : version pleine à deux tons.
const DUO = {
  todo: "inbox-bold-duotone",
  doing: "stopwatch-play-bold-duotone",
  done: "clipboard-check-bold-duotone",
  review: "magnifer-bold-duotone",
  approved: "verified-check-bold-duotone",
};

function build(map) {
  return Object.fromEntries(
    Object.entries(map).map(([key, name]) => {
      const data = getIconData(solar, name);
      if (!data) throw new Error(`Icône introuvable : ${name}`);
      const svg = iconToSVG(data);
      return [key, { body: svg.body, viewBox: svg.attributes.viewBox }];
    }),
  );
}

const out = `// Fichier généré par scripts/generate-icons.mjs : ne pas modifier à la main.
// Icônes Solar (480 Design), licence CC BY 4.0.

export const MONO_ICONS: Record<string, { body: string; viewBox: string }> = ${JSON.stringify(build(MONO), null, 2)};

export const DUO_ICONS: Record<string, { body: string; viewBox: string }> = ${JSON.stringify(build(DUO), null, 2)};
`;
writeFileSync(new URL("../src/components/icons.generated.ts", import.meta.url), out);
console.log("icons.generated.ts : ok");
