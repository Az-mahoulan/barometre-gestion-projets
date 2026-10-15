# Plateforme de gestion de projets — Baromètre

Projet indépendant d'AGRITRACK (aucun lien technique ni documentaire). Langue de travail : français.

- Pousser sur `main` après chaque modification demandée par l'utilisateur (accord donné le 14/10/2026) : Render redéploie automatiquement et il vérifie en ligne. Pas de fusion d'autres branches sans accord.
- Ne jamais lire ni recopier de secrets (`.env`).
- Mettre à jour `notes/journal.md` après un travail significatif.

## Structure

- `app/backend` : Django 5.2 + DRF + PostgreSQL. Tests : `cd app/backend && DJANGO_DEBUG=1 pytest`.
- `app/frontend` : Next.js 16 (voir `app/frontend/AGENTS.md` : lire `node_modules/next/dist/docs/` avant de coder). Contrôles : `npx tsc --noEmit && npm run lint && npm run build`.
- `docs/` : cadrage, recherche, architecture. `maquette/` : maquettes (HTML interactif, version dessinée). `ressources/` : références visuelles.
- Les calculs du tableau de bord vivent côté serveur (`app/backend/apps/dashboard/services.py`) ; les droits par rôle dans `apps/projects/access.py`.
- Ne jamais lancer `seed_demo` en production. Aucun secret dans le code : variables d'environnement (`app/.env.example`).

## Design (préférences de l'utilisateur)

- Travailler chaque élément ; éviter tout rendu « générique ». Avancer par petites modifications publiées une à une.
- Éléments « flottants » (pastille ou tuile posée sur un plus gros) : à juger au cas par cas selon les couleurs et l'endroit. Apprécié : la pastille blanche du filtre « Tous les projets ». Rejeté : la tuile blanche avec ombre sur le fond rose de l'alerte de retard (remplacée par un cercle en pointillé intégré au fond).
- Pas de fond noir pour les menus déroulants ; panneaux clairs, compacts, sans barre de défilement visible.
