# À faire plus tard (idées validées)

Liste des évolutions demandées, à reprendre quand le tableau de bord sera stabilisé.

## Tableau de bord

- [ ] **Sections déplaçables à volonté** : chaque utilisateur peut réorganiser les cartes du tableau de bord (glisser-déposer), et la disposition est mémorisée pour lui.
- [ ] **Icône « infos » devant le titre de chaque carte** : un clic ouvre une explication approfondie de la section (texte + vidéo) : l'idée derrière la carte, comment la lire et comment s'en servir.

## Modèle de données

- [x] Rattacher les activités à un jalon (projet > jalons > activités > tâches), lien facultatif — fait le 15/10/2026 (champ « Jalon » de l’activité, saisi dans l’admin).
- [ ] Écrans de saisie dans l'application (aujourd'hui dans l'admin Django) : dates clés des projets, dépendances entre jalons, jalon de chaque activité, livrables, participants des réunions, photo de profil.

## Démo en ligne (Render)

- [ ] **Date figée** : le serveur Django de démonstration a `APP_DEMO_TODAY=2026-10-14` (variable d'environnement sur Render et dans `render.yaml`). Le tableau de bord affiche donc toujours le 14 octobre comme « aujourd'hui ». Pour suivre la vraie date du Bénin (fuseau `Africa/Porto-Novo`, déjà réglé), vider ou retirer cette variable sur le service Django ; les données de démo vieilliront alors avec le temps. Gardé figé pour l'instant (décision du 15/10/2026).
- [ ] **« Aujourd'hui » selon l'endroit où se trouve la personne** (et non fixé au Bénin), pour ceux qui voyagent : l'interface envoie au serveur le fuseau horaire du navigateur (ou sa date locale), et les calculs « aujourd'hui », « en retard », « cette semaine » s'appuient dessus. Le fuseau `Africa/Porto-Novo` ne resterait qu'une valeur par défaut. À faire en même temps que la levée du figeage de la date.
