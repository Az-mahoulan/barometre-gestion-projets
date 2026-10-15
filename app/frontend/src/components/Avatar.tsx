"use client";

import { createContext, useContext } from "react";
import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";

import { TONES, toneFor } from "./tones";

// Avatars illustrés (DiceBear « Notionists », licence CC0), dessinés localement en attendant une photo de profil.
// Le serveur attribue à chaque profil une combinaison de traits unique (« hair=variant05;eyes=…;beard=none;… ») ;
// la table nom → combinaison est fournie par AvatarsProvider.
const AvatarsContext = createContext<Record<string, string | null | undefined>>({});
export const AvatarsProvider = AvatarsContext.Provider;

const CACHE = new Map<string, string>();

function avatarUri(seed: string, combo?: string | null): string {
  const key = combo || `seed:${seed}`;
  let uri = CACHE.get(key);
  if (!uri) {
    const opts: Record<string, unknown> = { seed, size: 64, gestureProbability: 0, bodyIconProbability: 0 };
    if (combo) {
      const parts = Object.fromEntries(combo.split(";").map((p) => p.split("=")));
      for (const k of ["hair", "eyes", "brows", "lips", "nose", "body"]) if (parts[k]) opts[k] = [parts[k]];
      for (const k of ["beard", "glasses"]) {
        if (parts[k] && parts[k] !== "none") {
          opts[k] = [parts[k]];
          opts[`${k}Probability`] = 100;
        } else {
          opts[`${k}Probability`] = 0;
        }
      }
    }
    uri = createAvatar(notionists, opts).toDataUri();
    CACHE.set(key, uri);
  }
  return uri;
}

/**
 * Avatar d'une personne : sa photo si elle existe, sinon son avatar illustré unique (sur la pastille pastel de ses
 * initiales). `seed` = le nom affiché, qui sert aussi à retrouver l'avatar attribué par le serveur.
 */
export function Avatar({
  initials,
  seed,
  photo,
  size = "h-8 w-8 text-[10.5px]",
}: {
  initials: string;
  seed?: string;
  photo?: string | null;
  size?: string;
}) {
  const avatars = useContext(AvatarsContext);
  const key = seed || initials;
  return (
    <span className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-bold ${TONES[toneFor(initials)]} ${size}`} title={seed}>
      {initials && initials !== "·" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo || avatarUri(key, seed ? avatars[seed] : undefined)} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
