# Recherche : premiers écrans et éléments permanents — v0.1

Statut : proposition à valider. Aucune création (maquette, code) n'a démarré.

Limites de la recherche : l'article Rocketlane donné en lien n'a pas pu être ouvert (serveur injoignable). Les sources ci-dessous sont des guides et comparatifs, souvent écrits par des éditeurs : à prendre comme pratiques courantes, pas comme références normatives. Aucune source fiable trouvée sur des seuils de charge de travail ni sur le taux de jalons tenus ; ces seuils seront à fixer avec le Baromètre.

## 1. Ce que font les outils du marché

- **Tableaux de bord par widgets** (cartes et graphiques), avec visibilité privée ou partagée et des filtres enregistrés : Rocketlane.
- **Vue portefeuille** : projets actifs, en pause, terminés, et lesquels sont sains, à risque ou en difficulté : Asana, Monday, ProjectManager.
- **Vues d'un même projet** : liste, tableau (kanban), calendrier, chronologie / Gantt : Asana, Monday, ClickUp.
- **Charge de travail** par personne : Asana, Monday, ClickUp.
- **Bonne pratique de tableau de bord de direction** : peu d'indicateurs, exceptions mises en évidence (rouge / orange), tendances en courbes miniatures, détail réservé à la vue gestionnaire. Retard mesuré en pourcentage de la durée prévue (vert < 10 %, jaune 10–20 %, rouge au-delà, repère du Conseil du Trésor du Canada).

## 2. Écrans proposés pour la V1 (par priorité)

| # | Écran | Pour qui | Contenu |
|---|---|---|---|
| 1 | **Tableau de bord** | Direction, gestionnaires | 4 chiffres clés (projets actifs, avancement global, tâches en retard, jalons tenus) ; santé de chaque projet ; projets à surveiller avec la raison ; charge de l'équipe ; calendrier des jalons |
| 2 | **Liste des projets** | Tous | Une ligne par projet : responsable, état (icône + texte), avancement, prochain jalon, fin prévue ; filtre par état |
| 3 | **Détail d'un projet** | Gestionnaires, équipe | Tableau des tâches par statut (À faire, En cours, En revue, Terminé), jalons, point d'attention, ajout de tâche |
| 4 | **Mes tâches** | Équipe, gestionnaires | Mes tâches classées : en retard, cette semaine, plus tard ; changement de statut |
| 5 | **Calendrier / jalons** | Gestionnaires, direction | Chronologie des projets avec jalons tenus, dépassés, à venir, ligne « aujourd'hui » |
| 6 | **Administration** | Administrateur | Utilisateurs, rôles, accès (liée au point « comptes » à discuter) |
| 7 | **Guide d'utilisation** | Tous | Aide courte intégrée (livrable n°4) |

Reportés après la V1 (à confirmer) : suivi du temps, budget, pièces jointes, notifications, exports PDF / Excel, tableaux de bord personnalisables.

## 3. Ce qui reste affiché sur chaque écran

- **En-tête permanent** : nom de l'outil, navigation adaptée au rôle, utilisateur et rôle courants.
- **État d'un projet** toujours sous la même forme : pastille couleur + icône + mot (« Dans les temps », « À surveiller », « En retard »). Jamais la couleur seule.
- **Échéance** : date de chaque tâche, en rouge avec icône si dépassée.
- **Responsable** : initiales / nom sur chaque tâche et chaque projet.
- **Avancement** : barre + « X % · n/N tâches ».
- **Retour** : lien de retour clair depuis le détail d'un projet.
- **Confirmation** : message bref après chaque action (tâche déplacée, ajoutée).

## 4. Droits par rôle (hypothèse)

| Rôle | Voit | Peut modifier |
|---|---|---|
| Direction | Tous les projets | Rien (consultation) |
| Gestionnaire de projet | Tous les projets | Créer et déplacer des tâches, gérer ses projets |
| Équipe | Tous les projets (à confirmer) | Uniquement ses propres tâches |

## 5. Règles de calcul proposées pour l'état d'un projet (à valider)

- **En retard** : un jalon dépassé non atteint, ou au moins 2 tâches en retard.
- **À surveiller** : 1 tâche en retard, ou avancement inférieur de plus de 15 points au temps écoulé.
- **Dans les temps** : sinon.

## 6. Pile technique recommandée

- Next.js (React, TypeScript) pour l'interface.
- **Django** (avec Django REST Framework ou Django Ninja) pour l'API, plutôt que FastAPI : Django fournit déjà authentification, rôles, migrations et interface d'administration, ce qui compte avec une échéance courte et un besoin de gestion des accès. FastAPI conviendrait mieux à une API pure sans administration.
- PostgreSQL.
- Compromis à connaître : deux bases de code (interface et API) donc plus de mise en place qu'avec Django seul. Si l'équipe n'est pas à l'aise avec React, Django avec HTMX serait plus rapide, au prix d'une interface moins interactive.

## 7. Questions à trancher avant de dessiner

1. Quels sont les vrais statuts de tâche et de projet du Baromètre ?
2. Un projet a-t-il des phases, des sous-tâches, des dépendances entre tâches ?
3. L'équipe voit-elle tous les projets ou seulement les siens ?
4. Faut-il le budget ou le suivi du temps dès la V1 ?
5. Quels seuils de retard la direction veut-elle ?
6. Combien d'utilisateurs, et quel mode de connexion ?

## Sources

- [Créer des tableaux de bord dans Rocketlane](https://help.rocketlane.com/support/solutions/articles/67000716838-how-to-create-dashboards-in-rocketlane-and-add-widgets-to-it-)
- [10 exemples de tableaux de bord projet (Tempo)](https://www.tempo.io/blog/project-dashboard-examples)
- [Tableaux de bord de gestion de projet (Cloudwards)](https://www.cloudwards.net/project-management-dashboard/)
- [Tableaux de bord projet (ProjectManager)](https://www.projectmanager.com/software/dashboards)
- [Guide des tableaux de bord de direction (Gouvernement du Canada)](https://www.canada.ca/en/treasury-board-secretariat/services/information-technology-project-management/project-management/guide-executive-project-dashboards.html)
- [Asana vs Monday (Upbase)](https://upbase.io/blog/asana-vs-monday/)
- [ClickUp vs Asana vs Monday (Browsee)](https://browsee.io/blog/choosing-the-best-project-management-tool-clickup-vs-asana-vs-monday/)
- [Django vs FastAPI en 2026 (Capital Numbers)](https://www.capitalnumbers.com/blog/django-vs-fastapi/)
