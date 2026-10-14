# Journal

## 2026-10-14
- Création du dossier et du dépôt local. Cadrage à démarrer.

## 2026-10-14 (suite)
- Échéance V1 : fin de semaine. Livrables : maquette, application fonctionnelle, document de conception.
- Pile envisagée : Next.js + Django + PostgreSQL (à valider).
- Recherche menée : docs/01_recherche_ecrans.md. Création de la maquette suspendue jusqu à validation des écrans.

## 2026-10-14 (maquette du tableau de bord)
- Références visuelles reçues (29 images) : `ressources/references-ui/`.
- Maquette du tableau de bord : `maquette/tableau-de-bord.html` (HTML autonome, données fictives).
- Contenu : 4 indicateurs, Gantt + chronologie, actions critiques, programmation (semaine), progression des tâches (5 statuts), évolution mensuelle des jalons, activités récentes, vue d'ensemble des projets (avec performance), vue d'ensemble des équipes (disponibilité, raison, lieu), assistant IA simulé.
- Hypothèses à valider : formule de performance, périmètre par rôle, échéances dans « Actions critiques » (urgentes) et « Programmation » (toutes).

## 2026-10-14 (maquette dessinée)
- Maquette dessinée en style blanc, sur une seule page : `maquette/dessinee/`.
- Retours : tout sur le même tableau de bord, Gantt sans losanges (prochain jalon écrit sous le projet), IA intégrée (synthèse du jour et saisie).
- Reste : fenêtre de conversation de l assistant, version téléphone, écrans suivants.

## 2026-10-14 (conception réelle du tableau de bord)
- Pile retenue : Next.js 16 + Django 5.2 + PostgreSQL (docs/architecture/01_architecture.md).
- `app/` : serveur (modèles, API du tableau de bord, droits par rôle, données de démo, 31 tests) et interface (tableau de bord complet, connexion).
- Vérifié de bout en bout avec un navigateur : connexion des 3 rôles, mêmes chiffres que la maquette (6 / 2 / 2 / 50 %).
- Reste : assistant IA conversationnel, import Gantt, création de projet, écrans suivants, sauvegardes.

## 2026-10-14 (déploiement Render)
- `render.yaml` (démonstration gratuite) et `render.production.yaml` (serveur privé, payant) ; guide : docs/deploiement-render.md.
- Ajouts : sonde de santé `/api/v1/health/`, `seed_demo --if-empty`, super-utilisateur = administrateur de l'application.
- Séquence de démarrage vérifiée en local avec PostgreSQL 16 et réglages de production (migration, données, connexion, CSRF, cookies sécurisés).
- Non vérifié : le déploiement réel sur Render (compte, noms d'offres et de domaines).

## 2026-10-14 (refonte visuelle du tableau de bord)
- Critique détaillée de la version en ligne (module frontend-design + critique de design) : trop de cartes identiques, éléments décoratifs ou inactifs, symboles « IA » génériques.
- Refonte : police IBM Plex Sans, échelle typographique 12 / 14 / 16 / 20 / 28, titres de section hors des panneaux, synthèse de l'assistant en tête avec les 4 chiffres et l'avancement des tâches (barre segmentée à la place du demi-anneau).
- Retiré : barre de recherche et boutons inactifs, cloche, liste des projets du menu, icônes décoratives, pastilles de disponibilité, hachures et bulles du graphique, points médians et flèches dans les textes.
- Serveur : les actions à traiter renvoient projet, personne et échéance séparément ; message clair quand le serveur de démonstration se réveille (erreurs 502 à 504).
- Vérifié en local : tests serveur (34), types, lint, build ; connexion admin et membre, aucune erreur console, pas de débordement à 400 px.
