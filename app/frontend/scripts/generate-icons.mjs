// Génère src/components/icons.generated.ts à partir des bibliothèques Fluent (Microsoft, licence MIT) via Iconify.
// Seules les icônes listées ici sont incluses dans l'application. Relancer : node scripts/generate-icons.mjs
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

import { getIconData, iconToSVG } from "@iconify/utils";

const require = createRequire(import.meta.url);
const mono = require("@iconify-json/fluent/icons.json");
const color = require("@iconify-json/fluent-color/icons.json");

// Nom utilisé dans l'application → icône Fluent monochrome (suit la couleur du texte).
const MONO = {
  grid: "grid-24-regular",
  folder: "folder-24-regular",
  task: "task-list-square-ltr-24-regular",
  calendar: "calendar-24-regular",
  users: "people-team-24-regular",
  chart: "data-bar-vertical-24-regular",
  shield: "shield-24-regular",
  gear: "settings-24-regular",
  search: "search-24-regular",
  bell: "alert-24-regular",
  sparkle: "sparkle-24-regular",
  upload: "arrow-upload-24-regular",
  send: "send-24-regular",
  flag: "flag-24-regular",
  clock: "clock-24-regular",
  check: "checkmark-24-regular",
  chevron: "chevron-down-24-regular",
  pin: "location-24-regular",
  logout: "sign-out-24-regular",
};

// Nom utilisé dans l'application → icône Fluent en couleur (couleurs propres à l'icône).
const COLOR = {
  todo: "clipboard-text-edit-24",
  doing: "people-sync-24",
  done: "clipboard-task-24",
  review: "person-feedback-24",
  approved: "checkmark-circle-24",
};

function build(set, map) {
  return Object.fromEntries(
    Object.entries(map).map(([key, name]) => {
      const data = getIconData(set, name);
      if (!data) throw new Error(`Icône introuvable : ${name}`);
      const svg = iconToSVG(data);
      return [key, { body: svg.body, viewBox: svg.attributes.viewBox }];
    }),
  );
}

const out = `// Fichier généré par scripts/generate-icons.mjs : ne pas modifier à la main.
// Icônes Fluent UI System Icons (Microsoft), licence MIT.

export const MONO_ICONS: Record<string, { body: string; viewBox: string }> = ${JSON.stringify(build(mono, MONO), null, 2)};

export const COLOR_ICONS: Record<string, { body: string; viewBox: string }> = ${JSON.stringify(build(color, COLOR), null, 2)};
`;
writeFileSync(new URL("../src/components/icons.generated.ts", import.meta.url), out);
console.log("icons.generated.ts : ok");
