// Génère src/components/icons.generated.ts via Iconify : Solar (480 Design, CC BY 4.0), Font Awesome Free (CC BY 4.0)
// et Material Symbols (Google, Apache 2.0).
// Les icônes sont des SVG monochromes : elles prennent la couleur du texte (couleurs de la plateforme).
// Seules les icônes listées ici sont incluses dans l'application. Relancer : node scripts/generate-icons.mjs
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

import { getIconData, iconToSVG } from "@iconify/utils";

const require = createRequire(import.meta.url);
const solar = require("@iconify-json/solar/icons.json");
const fa = require("@iconify-json/fa6-solid/icons.json");
const material = require("@iconify-json/material-symbols/icons.json");

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

// Tuiles de progression des tâches : icônes pleines, d'après la référence « Task Flow » fournie.
const TILES = {
  todo: [fa, "box-archive"],
  doing: [fa, "users-gear"],
  done: [fa, "flag"],
  review: [material, "youtube-searched-for"],
  approved: [fa, "circle-check"],
};

function build(map) {
  return Object.fromEntries(
    Object.entries(map).map(([key, entry]) => {
      const [set, name] = Array.isArray(entry) ? entry : [solar, entry];
      const data = getIconData(set, name);
      if (!data) throw new Error(`Icône introuvable : ${name}`);
      const svg = iconToSVG(data);
      return [key, { body: svg.body, viewBox: svg.attributes.viewBox }];
    }),
  );
}

const out = `// Fichier généré par scripts/generate-icons.mjs : ne pas modifier à la main.
// Icônes Solar (480 Design, CC BY 4.0), Font Awesome Free (CC BY 4.0) et Material Symbols (Google, Apache 2.0).

export const MONO_ICONS: Record<string, { body: string; viewBox: string }> = ${JSON.stringify(build(MONO), null, 2)};

export const TILE_ICONS: Record<string, { body: string; viewBox: string }> = ${JSON.stringify(build(TILES), null, 2)};
`;
writeFileSync(new URL("../src/components/icons.generated.ts", import.meta.url), out);
console.log("icons.generated.ts : ok");
