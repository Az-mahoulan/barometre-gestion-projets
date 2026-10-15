// Pastilles pastel : fond clair et icône/texte de la même teinte.
export const TONES = {
  lav: "bg-lav-soft text-lav",
  peach: "bg-peach-soft text-peach",
  mint: "bg-ok-soft text-ok",
  sky: "bg-info-soft text-info",
  rose: "bg-late-soft text-late",
  sand: "bg-risk-soft text-risk",
  gray: "bg-surface-2 text-ink-2",
} as const;
export type Tone = keyof typeof TONES;

const AVATAR_TONES: Tone[] = ["lav", "sky", "mint", "peach", "sand", "rose"];

/** Couleur stable par personne, calculée à partir des initiales. */
export function toneFor(key: string): Tone {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 997;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}
