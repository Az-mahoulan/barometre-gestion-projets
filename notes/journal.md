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
- Gantt des jalons (GanttCard refait) : filtre de projet (ProjectPicker) ; « Tous les projets » = une ligne par projet en cours découpée à chaque jalon ; un projet = une ligne par jalon (du jalon précédent à l'échéance). Couleurs : atteint / à venir / dépassé, échéance en couleur franche, retard en pointillé jusqu'à aujourd'hui ; style de la chronologie.
- Dépendances entre jalons : champ `Milestone.depends_on` (« Dépend de », même projet, saisi dans l'admin) ; migration 0005 (dépendances de démonstration). Gantt d'un projet : liaisons coudées (grises, rouges si elles partent d'un retard), jalons menacés en contour pointillé + mention « menacé », message « Le retard de … menace N jalons ». Vue « Tous les projets » : « N menacés » sous le compte de jalons.
- Carte « Activités de la semaine » (WeekActivitiesCard) : une barre en pilule par activité en cours, couleur du projet (palette partagée `lib/projectColors.ts`, aussi utilisée par la chronologie), partie écoulée pleine et reste hachuré, trait d'aujourd'hui, jours en bas, navigation par semaine. Vocabulaire retenu : « activité » (projet > jalons > activités > tâches).
- Activités de la semaine refaites d'après le modèle « Task Timeline » : carte compacte (colonne de droite), sélecteur de semaine, pilules de 26 px arrondies, reste hachuré gris, trait d'aujourd'hui vert-citron, dates = lignes verticales, zone défilante au-delà de 6 activités, tri par date de fin. Palette des projets plus vive (partagée avec la chronologie). Migration 0006 : activités courtes de démonstration.
- Vue d'ensemble des équipes refaite d'après le modèle « Patient's list » : cartes individuelles arrondies (tuile d'initiales, pastille de tâches), carte choisie prolongée en onglet jusqu'à la fiche avec courbures inversées ; tons sobres (gris clair, vert-citron très léger) ; titres « Membres » / « Fiche du membre » ; filtre par statut ; liste défilante avec petit curseur.
- Vue d'ensemble des équipes : retour à la grille de cartes (4 par ligne), préférée à la version liste + fiche.
- Avatars illustrés par défaut (DiceBear « Notionists », CC0) générés localement à partir du nom, sur la pastille pastel ; le composant `Avatar` accepte déjà une `photo` qui les remplacera.
- Avatar unique par profil : champs `User.avatar_style` (neutre / masculin / féminin, facultatif) et `User.avatar` (combinaison de traits unique, contrainte d'unicité), attribués à la création (migration accounts 0002 pour les comptes existants, styles de démonstration). Route `POST /api/v1/auth/me/avatar/` ; menu « Mon avatar » sur la puce du profil (style + « Nouvel avatar »). Coiffures classées par style dans `apps/accounts/avatars.py`.
- Progression des tâches : seconde disposition « en colonne » (statuts en liste + anneau segmenté façon modèle (coins à peine arrondis, couleurs pures de l'évolution mensuelle, étiquettes « Statut xx % » reliées par des traits), total au centre, taille minimale pour les petits statuts) ; bascule ligne / colonne dans l'en-tête, choix retenu sur l'appareil.
- Anneau de la progression des tâches redessiné avec d3-shape (portions exactes : coins arrondis réguliers, espaces aux bords parallèles, taille minimale 24° pour les petits statuts) ; étiquettes « statut / % » dans l'axe de chaque portion, reliées par un trait court et épais.

- 15/10/2026 — Progression des tâches (colonne) : retour aux étiquettes latérales reliées par un trait coudé, désormais encadrées en pointillé (statut au-dessus, pourcentage centré dessous) ; anneau d3-shape conservé.
- 15/10/2026 — Anneau des tâches strictement proportionnel (suppression de la taille minimale de 24° qui égalisait 2 % et 6 %) ; traits d’étiquettes à 45° puis horizontaux.
- 15/10/2026 — Vue « diagramme » par défaut pour la progression des tâches. Livrables : nouveau modèle `Deliverable` (intitulé, échéance, date de remise ; saisie dans l’admin, livrables de démonstration via migration 0007 gardée) ; dans la vue d’ensemble des projets, un verre dont le liquide monte au niveau livrés ÷ prévus puis tangue (animation coupée si « réduire les animations »), avec le compte « 3/4 ».
- 15/10/2026 — Verre des livrables coloré selon l’état du projet (vert, orange, rouge), comme l’anneau d’avancement.
- 15/10/2026 — Étiquettes d’état des projets (vue d’ensemble) : sablier dont le sable du haut = temps restant jusqu’à l’échéance (fin prévue), filet qui s’écoule, et décompte sem · j · h · min · s mis à jour chaque seconde (calculé dans le navigateur à partir de l’heure de référence du serveur) ; « Échéance dépassée de … » au-delà. Projet achevé : verre plein et immobile.
- 15/10/2026 — Décompte sans les secondes ; sablier sorti de l’étiquette, posé juste à côté (couleur de l’état) ; bord du verre des livrables en pointillé.
- 15/10/2026 — Verre des livrables revenu au trait plein ; décompte raccourci (« 2s 2j 10h59 ») ; fond doux de la teinte de l’état englobant étiquette, sablier et décompte.
- 15/10/2026 — Sablier placé au début du décompte (sous l’étiquette) ; « sem » rétabli (« 2sem 2j 10h59 »).
- 15/10/2026 — Vue d’ensemble des projets : colonnes réordonnées (livrables, performance, prochain jalon, jalons, échéance) ; liquide du verre adouci (couleur de l’état à 70 % mêlée de blanc).
- 15/10/2026 — Vue d’ensemble des projets : sous le nom, photos superposées de l’équipe (responsable puis personnes ayant une tâche dans le projet, 6 au plus puis « +n », noms au survol) à la place de « responsable · pays ».
- 15/10/2026 — Photos de l’équipe : contour discret (liseré blanc + fin trait gris) pour séparer les visages superposés.
- 15/10/2026 — Photos de l’équipe : contour réellement circulaire (le conteneur prend la taille exacte de la photo) et plus fin.
- 15/10/2026 — Nouvelle carte « Progression des jalons » (colonne principale, après le Gantt) : une bande par jalon, toutes partant du même bord jusqu’à l’échéance, partie réalisée plus pure selon l’avancement des tâches des activités rattachées au jalon ; en tête seulement « Aujourd’hui » et la date de fin ; photo de la personne la plus impliquée ; filtre par projet (tous les projets : jalons non atteints). Backend : `ProjectActivity.milestone` (migration 0008, rattachement de démonstration gardé), jalons du Gantt enrichis (début, avancement, personne principale).
- 15/10/2026 — Progression des jalons refondue : bandes de même longueur ; partie plus pure = avancement réel, petit trait épais = avancement attendu à date (part écoulée de la période du jalon) ; tout est écrit dans la bande (membres : 2 photos puis « +n », nom, %, échéance) ; plus d’en-tête « Aujourd’hui » ni de trait.
- 15/10/2026 — Progression des jalons : trait du prévu sur toute la hauteur de la bande (sans arrondi) ; % atteint au bout de la partie réalisée (sinon après le nom) et « prévu x % » près du trait (sinon avant l’échéance) ; bandes à 80 % de la largeur, espacées comme le modèle.
- 15/10/2026 — Progression des jalons : seulement les jalons en cours d’exécution (période commencée, échéance non passée) ; l’avancement ne compte que les tâches prévues dans la période du jalon. Démo plus réaliste (migration 0009 gardée) : « Rapport d’audit » en cours, activités Développement → Version bêta, Rédaction → Premier jet, Prototype → Prototype. Test de la démo : 10 actions critiques (au lieu de 11).
- 15/10/2026 — Progression des jalons : nom du projet retiré des bandes (visible au survol) ; carte de même hauteur que « Activités de la semaine », liste défilante avec fondu en bas.
- 15/10/2026 — « Activités de la semaine » déplacée à côté de « Progression des jalons » (même ligne, colonne principale) ; pourcentages jamais posés sur le trait du prévu.
- 15/10/2026 — Progression des jalons : % prévu affiché au-dessus du trait (« prévu · 82 % » sur la première bande, puis le seul pourcentage).
- 15/10/2026 — Progression des jalons : textes des bandes en blanc (bandes plus soutenues pour la lisibilité) ; % réalisé au-dessus du bout de la partie remplie et % prévu au-dessus du trait (« réalisé · » / « prévu · » sur la première bande) ; ▼ rouge si en retard sur le prévu.
- 15/10/2026 — Progression des jalons : ▲ vert quand le réalisé dépasse le prévu (symétrique du ▼ rouge).
- 15/10/2026 — Progression des jalons : bandes moins arrondies (10 px au lieu de pilule).
- 15/10/2026 — Progression des jalons : photos des membres en fin de bande, juste avant l’échéance ; le nom du jalon ouvre la bande.
- 15/10/2026 — Progression des jalons : photos retirées ; nom du jalon au-dessus de la bande, aligné avec les pourcentages ; échéance seule dans la bande ; couleurs uniformes selon l’écart au prévu (rouge sous le prévu, vert clair conforme à ± 5 points, vert au-dessus), trait du prévu noir.
- 15/10/2026 — Progression des jalons : « comme prévu » en jaune (au lieu du vert clair), vert réservé au-dessus du prévu.
- 15/10/2026 — Progression des jalons : fond léger sur la zone défilante, axe des pourcentages (0 à 100 %) en haut et repères verticaux discrets à 25, 50 et 75 %.
- 15/10/2026 — Palette des projets (activités de la semaine, chronologie) sans vert, orange ni rouge, réservés aux états : framboise, fuchsia, indigo et ardoise remplacent rose, vert, orange et rouge-orangé.
- 15/10/2026 — Progression des jalons : repère vertical à 100 % ajouté.
- 15/10/2026 — Cartes déplaçables (glisser-déposer, @dnd-kit) : poignée au survol en haut de chaque carte, souris, toucher ou clavier (espace, flèches, espace) ; réordonnancement dans chaque colonne ; disposition enregistrée sur le profil (`User.dashboard_layout`, POST /auth/me/layout/, migration accounts 0003) ; « Rétablir la disposition des cartes » dans le menu du profil. Test ajouté.
- 15/10/2026 — Progression des tâches (anneau) : traits de liaison en équerre qui ne traversent jamais l’anneau (droit si même hauteur, vertical puis horizontal vers l’extérieur, sinon contournement).
- 15/10/2026 — Ordre par défaut des cartes repensé pour un gestionnaire de projet. Colonne principale : vue d’ensemble des projets, progression des jalons + activités de la semaine, progression des tâches, Gantt des jalons, chronologie, évolution mois par mois, équipes. Colonne de droite : synthèse, actions critiques, programmation, activités récentes. Les dispositions personnelles déjà enregistrées sont conservées.
- 16/10/2026 — Actions critiques repliables : bouton chevron dans l’en-tête ; repliée, la carte montre un résumé par gravité (en retard, échéances proches, à approuver) et « Voir tout » ; choix retenu sur l’appareil.
- 16/10/2026 — Colonne de droite accrochée (StickySide) : elle défile jusqu’à ce que son dernier élément soit visible, puis reste en place pendant que la grande colonne continue (grand écran seulement).
- 19/10/2026 — Début des autres écrans. Navigation réelle (liens de la barre latérale, page courante surlignée) et cadre commun `AppFrame`. Écran **Projets** (/projets) : liste filtrable par état (avec compteurs), pays et nom ; chaque ligne ouvre le détail. Écran **Détail d’un projet** (/projets/[id]) : en-tête (responsable, dates, échéance, avancement, performance, jalons, livrables, retards), tâches par statut avec changement de statut selon les droits, jalons, activités, équipe, livrables, dates clés, journal. API : GET /projects/ et /projects/<id>/ (périmètre par rôle, test ajouté). Autres entrées du menu : page « en préparation » qui annonce le contenu.
