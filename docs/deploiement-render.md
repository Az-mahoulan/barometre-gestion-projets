# Déployer sur Render : guide pas à pas

Deux fichiers de configuration (Blueprint) sont à la racine du dépôt :

| Fichier | Pour quoi | Coût |
|---|---|---|
| `render.yaml` | **Démonstration** : 2 services web + 1 base, données fictives | Gratuit |
| `render.production.yaml` | **Usage durable** : serveur Django privé, base payante, pas de données fictives | Payant (à vérifier sur la page de prix de Render) |

Limites de l'offre gratuite (documentation Render) : un service s'endort après 15 minutes d'inactivité et met environ 1 minute à se réveiller ; la base gratuite est **supprimée 30 jours après sa création** et n'a pas de sauvegarde ; un service gratuit ne peut pas recevoir de trafic privé, d'où un serveur Django public dans la version de démonstration. Ne mettez aucune donnée réelle dans la version gratuite.

## Avant de commencer

1. Le code doit être sur GitHub (dépôt `Az-mahoulan/barometre-gestion-projets`, branche `main`).
2. Un compte Render (https://render.com), connecté à votre compte GitHub, avec accès à ce dépôt.

## Démonstration gratuite

1. Dans Render : **New** → **Blueprint** → choisir le dépôt `barometre-gestion-projets`. Render lit `render.yaml`.
2. Valider la création. Render construit trois éléments : la base `barometre-db`, le serveur `barometre-api`, l'interface `barometre-pilotage`. Comptez 5 à 10 minutes la première fois.
3. Ouvrir l'adresse de `barometre-pilotage` (du type `https://barometre-pilotage.onrender.com`).
4. Se connecter avec l'identifiant `admin` (ou `mireille`, `sena`, `koffi`…). Le mot de passe est généré par Render : dans le service `barometre-api` → **Environment** → variable `DEMO_PASSWORD`.

### Si Render a ajouté un suffixe aux adresses

Si une adresse n'est pas exactement `barometre-api.onrender.com` ou `barometre-pilotage.onrender.com` (nom déjà pris), la connexion échouera. Corriger, puis relancer chaque service (**Manual Deploy** → **Deploy latest commit**) :

| Service | Variable | Valeur |
|---|---|---|
| `barometre-api` | `DJANGO_ALLOWED_HOSTS` | adresse réelle du serveur, sans `https://` |
| `barometre-api` | `DJANGO_CSRF_TRUSTED_ORIGINS` | adresse réelle de l'interface, avec `https://` |
| `barometre-pilotage` | `BACKEND_URL` | adresse réelle du serveur, avec `https://` |

## Production (serveur privé)

1. **New** → **Blueprint**, puis dans « Blueprint file path » indiquer `render.production.yaml`.
2. Render demande trois valeurs : `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD`. Choisir un mot de passe long et unique ; il n'est enregistré que dans Render, jamais dans le dépôt.
3. Vérifier les noms d'offres (`plan:`) dans le fichier avec la grille actuelle de Render, notamment celle de la base.
4. Ajouter le domaine de l'entreprise dans l'interface (**Settings** → **Custom Domains**), puis mettre `DJANGO_CSRF_TRUSTED_ORIGINS` à `https://votre-domaine`.
5. Avant l'ouverture aux équipes : activer les sauvegardes de la base, prévoir la supervision, et faire relire la sécurité.

La production n'exécute jamais les données de démonstration (`SEED_DEMO` absent).

## Dépannage

- **Page blanche ou « Impossible de charger »** : le service Django dort encore (démonstration) ; attendre 1 minute et recharger.
- **Erreur 403 à la connexion** : `DJANGO_CSRF_TRUSTED_ORIGINS` ne correspond pas à l'adresse de l'interface.
- **Erreur 400 « Invalid host »** : `DJANGO_ALLOWED_HOSTS` ne correspond pas à l'adresse du serveur.
- **Journaux** : dans chaque service, onglet **Logs**.
