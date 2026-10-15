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

## 2026-10-14 (refonte visuelle annulée)
- Une refonte (police IBM Plex Sans, synthèse en tête, moins de cartes) a été publiée puis annulée à la demande : le rendu a été jugé moins bon que la version précédente.
- Retour à la version d'origine du tableau de bord (commit d'annulation de bf2146a).

## 2026-10-15 (style v2 inspiré d'Eduplex)
- Maquette `maquette/tableau-de-bord-v2.html` validée, puis appliquée au site : menu latéral sombre avec accent vert-citron, fond clair, cartes blanches très arrondies, pastilles pastel, police Plus Jakarta Sans, icônes Material UI.
- Mise en page en deux colonnes : à gauche indicateurs, évolution mensuelle, programmation, progression des tâches, Gantt, projets, équipes ; à droite synthèse de l'assistant (carte sombre), calendrier des jalons, actions critiques, activités récentes.
- Nouveau : calendrier du mois (jalons prévus / dépassés), écart de l'évolution par rapport au mois précédent.
- Réveil du serveur Django depuis le navigateur (`/reveil`) : sur l'offre gratuite de Render, les appels relayés par Next ne réveillent pas le service.
- Programmation : le calendrier du mois devient l'en-tête de la carte (semaine affichée surlignée, clic sur un jour pour voir ses éléments) ; trois couleurs seulement (réunion bleu, échéance orange, retard rouge) ; légende collée en bas.
- Échéances affichées : fins de projets et d'activités, jalons, tâches, avec les personnes concernées (responsable du projet, assignés des tâches, participants des réunions). Nouveau champ `CalendarEvent.participants` (migration 0002, qui renseigne aussi les réunions de démonstration si elles existent).
- Filtre de projet sur mesure (`ProjectPicker`) pour l'évolution mensuelle et la progression des tâches : pilule claire (vert-citron si un projet est choisi), panneau clair et compact, onglets « En cours » / « Achevés », liste défilante sans barre visible, navigation au clavier.
- Programmation déplacée sous la synthèse de l'assistant ; barres de l'évolution mensuelle élargies.
- Évolution mois par mois : « Tous les projets » ne compte plus les projets achevés (un projet achevé reste consultable seul via le filtre).
- Carte « Chronologie des projets » (TimelineCard) : tableau récapitulatif par année ; en-tête = dates de début, de fin et dates clés, dans l'ordre (pas d'échelle régulière, pas de défilement) ; barres du début à la fin ; dates clés en losanges nommés ; trait « Aujourd'hui ». Année en cours : projets en cours ; autres années : tous les projets de l'année.
- Nouveau modèle `ProjectKeyDate` (dates clés saisies par le gestionnaire, distinctes des jalons), en ligne dans l'admin des projets ; `key_dates` dans `gantt` ; migration 0004 (4 dates clés de démonstration).
