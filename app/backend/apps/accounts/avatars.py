"""Avatars illustrés (DiceBear « Notionists », CC0) : une combinaison de traits unique par profil.

Le serveur choisit la combinaison exacte (coiffure, yeux, sourcils, bouche, nez, barbe, lunettes, haut) et vérifie
qu'aucun autre profil ne l'a déjà ; l'interface la dessine telle quelle. Le style (masculin, féminin, neutre)
limite les coiffures et la barbe ; il est facultatif et choisi par la personne.
"""

from __future__ import annotations

import secrets


def _v(*nums: int) -> list[str]:
    return [f"variant{n:02d}" for n in nums]


# Coiffures classées d'après la planche des 63 variantes ; écartées : casquette, toque (14), crêtes (50, 51).
HAIR_FEMININE = _v(2, 4, 8, 10, 11, 23, 28, 29, 36, 37, 39, 41, 43, 45, 46, 47, 48, 57, 58, 59, 61, 62, 63)
HAIR_MASCULINE = _v(5, 6, 7, 13, 15, 16, 18, 21, 24, 25, 27, 31, 34, 35, 38, 44, 49, 52, 53, 54, 55, 56, 60)
HAIR_MIXED = _v(1, 3, 9, 12, 17, 19, 20, 22, 26, 30, 32, 33, 40, 42)

EYES = _v(*range(1, 6))
BROWS = _v(*range(1, 14))
LIPS = _v(*range(1, 31))
NOSE = _v(*range(1, 21))
BEARD = _v(*range(1, 13))
GLASSES = _v(*range(1, 12))
BODY = _v(*range(1, 26))

STYLES = ("neutral", "masculine", "feminine")


def random_combo(style: str) -> str:
    """Tire une combinaison au hasard pour le style donné, sous forme « trait=variante;… »."""
    pick = secrets.choice
    if style == "masculine":
        hair = pick(HAIR_MASCULINE + HAIR_MIXED)
        beard = pick(BEARD) if secrets.randbelow(100) < 35 else "none"
    elif style == "feminine":
        hair = pick(HAIR_FEMININE + HAIR_MIXED)
        beard = "none"
    else:
        hair = pick(HAIR_FEMININE + HAIR_MASCULINE + HAIR_MIXED)
        beard = "none"
    glasses = pick(GLASSES) if secrets.randbelow(100) < 20 else "none"
    parts = {
        "hair": hair, "eyes": pick(EYES), "brows": pick(BROWS), "lips": pick(LIPS), "nose": pick(NOSE),
        "beard": beard, "glasses": glasses, "body": pick(BODY),
    }
    return ";".join(f"{k}={v}" for k, v in parts.items())


def unique_combo(style: str, taken: set[str]) -> str:
    """Combinaison qu'aucun autre profil n'utilise (plusieurs millions de possibilités : quelques essais suffisent)."""
    for _ in range(200):
        combo = random_combo(style)
        if combo not in taken:
            return combo
    raise RuntimeError("Impossible de trouver un avatar libre.")


def assign_avatar(user, style: str | None = None, save: bool = True) -> str:
    """Attribue à `user` un nouvel avatar unique (et éventuellement un nouveau style)."""
    model = user._meta.model  # fonctionne aussi pour request.user (objet « paresseux »)
    if style in STYLES:
        user.avatar_style = style
    taken = set(model.objects.exclude(pk=user.pk).exclude(avatar__isnull=True).values_list("avatar", flat=True))
    user.avatar = unique_combo(user.avatar_style or "neutral", taken)
    if save and user.pk:
        user.save(update_fields=["avatar", "avatar_style"])
    return user.avatar
